import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/ui";
import {
  Camera,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
} from "lucide-react";
import {
  loadFaceModels,
  detectFace,
  fetchEnrollments,
  matchFace,
  clockPerson,
  enrollFace,
  captureSnapshotAsync,
  type FaceEnrollment,
  type ClockResult,
} from "@/services/faceService";
import { supabase, isSupabaseConfigured } from "@/services/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type PageStatus =
  | "loading"
  | "ready"
  | "scanning"
  | "matched"
  | "clocked"
  | "error"
  | "no-match"
  | "enrolling";

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
}

// ── Main Component ───────────────────────────────────────────────────────────

const TimeClock = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<PageStatus>("loading");
  const [message, setMessage] = useState("Initializing facial recognition…");
  const [enrollments, setEnrollments] = useState<FaceEnrollment[]>([]);
  const [clockResult, setClockResult] = useState<ClockResult | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Enrollment mode
  const [enrollMode, setEnrollMode] = useState(false);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [enrollMsg, setEnrollMsg] = useState("");

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Initialize camera + models ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Load face-api models
        setMessage("Loading face recognition models…");
        await loadFaceModels();

        // Start camera
        setMessage("Starting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Load enrollments
        setMessage("Loading enrolled faces…");
        const data = await fetchEnrollments();
        if (!cancelled) {
          setEnrollments(data);
          setStatus("ready");
          setMessage(
            `Ready — ${data.length} face(s) enrolled. Press Scan to clock in/out.`,
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Init error:", err);
          setStatus("error");
          setMessage(
            err instanceof DOMException && err.name === "NotAllowedError"
              ? "Camera access denied. Please allow camera permissions and reload."
              : `Initialization failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Scan & Match ───────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (!videoRef.current || status === "scanning") return;

    setStatus("scanning");
    setMessage("Scanning face…");
    setClockResult(null);

    const descriptor = await detectFace(videoRef.current);
    if (!descriptor) {
      setStatus("no-match");
      setMessage("No face detected. Please look at the camera and try again.");
      return;
    }

    const match = matchFace(descriptor, enrollments);
    if (!match) {
      setStatus("no-match");
      setMessage("Face not recognized. Please enroll first or try again.");
      return;
    }

    // Matched — clock them in/out
    setStatus("matched");
    setMessage(`Recognized: ${match.name} — clocking…`);

    const result = await clockPerson(match.per_id, match.name);
    setClockResult(result);

    if (result.success) {
      setStatus("clocked");
      setMessage(
        `${result.name} — ${result.slotLabel} recorded at ${result.time}`,
      );
    } else {
      setStatus("error");
      setMessage(result.error || "Failed to record time.");
    }

    // Auto-reset after 4 seconds
    setTimeout(() => {
      setStatus("ready");
      setMessage(
        `Ready — ${enrollments.length} face(s) enrolled. Press Scan to clock in/out.`,
      );
      setClockResult(null);
    }, 4000);
  }, [status, enrollments]);

  // ── Enrollment ─────────────────────────────────────────────────────────────
  const openEnrollMode = useCallback(async () => {
    setEnrollMode(true);
    setEnrollMsg("");
    setSelectedPersonnel("");

    if (!isSupabaseConfigured() || !supabase) return;

    const { data } = await supabase
      .schema("hr")
      .from("personnel")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name");

    setPersonnelList((data as Personnel[]) ?? []);
  }, []);

  const handleEnroll = useCallback(async () => {
    if (!videoRef.current || !selectedPersonnel) return;

    setEnrollMsg("Detecting face…");
    const descriptor = await detectFace(videoRef.current);
    if (!descriptor) {
      setEnrollMsg("No face detected. Look at the camera and try again.");
      return;
    }

    setEnrollMsg("Saving enrollment…");
    const snapshot = await captureSnapshotAsync(videoRef.current);
    if (!snapshot) {
      setEnrollMsg("Failed to capture snapshot.");
      return;
    }

    const result = await enrollFace(selectedPersonnel, descriptor, snapshot);
    if (result.success) {
      setEnrollMsg("Enrollment successful!");
      // Refresh enrollments
      const updated = await fetchEnrollments();
      setEnrollments(updated);
      setMessage(
        `Ready — ${updated.length} face(s) enrolled. Press Scan to clock in/out.`,
      );
      setTimeout(() => setEnrollMode(false), 1500);
    } else {
      setEnrollMsg(`Enrollment failed: ${result.error}`);
    }
  }, [selectedPersonnel]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const statusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-6 h-6 animate-spin text-blue-400" />;
      case "scanning":
        return <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />;
      case "clocked":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case "error":
      case "no-match":
        return <XCircle className="w-6 h-6 text-red-400" />;
      case "matched":
        return <UserCheck className="w-6 h-6 text-green-400" />;
      default:
        return <Camera className="w-6 h-6 text-muted" />;
    }
  };

  const statusColor = (): string => {
    switch (status) {
      case "clocked":
      case "matched":
        return "border-green-500 shadow-green-500/20";
      case "error":
      case "no-match":
        return "border-red-500 shadow-red-500/20";
      case "scanning":
        return "border-yellow-500 shadow-yellow-500/20 animate-pulse";
      default:
        return "border-border";
    }
  };

  const currentSlotLabel = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return "AM Period";
    return "PM Period";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Clock"
        subtitle="Facial Recognition Time-In / Time-Out"
        icon={<Camera className="w-6 h-6" />}
      />

      {/* Live Clock */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-success" />
          <div>
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {currentTime.toLocaleTimeString("en-PH", { hour12: true })}
            </span>
            <span className="ml-3 text-sm text-muted">
              {currentTime.toLocaleDateString("en-PH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <span className="text-sm font-medium text-success bg-success/10 px-3 py-1 rounded-full">
          {currentSlotLabel()}
        </span>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <div
            className={`relative overflow-hidden rounded-2xl border-2 bg-black shadow-lg transition-all duration-300 ${statusColor()}`}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video object-cover"
            />

            {/* Scanning overlay */}
            {status === "scanning" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-48 h-48 border-4 border-yellow-400 rounded-full animate-ping opacity-30" />
              </div>
            )}

            {/* Success overlay */}
            {status === "clocked" && clockResult?.success && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="bg-green-600 text-white rounded-2xl px-8 py-6 text-center shadow-2xl">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xl font-bold">{clockResult.name}</p>
                  <p className="text-lg">{clockResult.slotLabel}</p>
                  <p className="text-2xl font-mono mt-1">{clockResult.time}</p>
                </div>
              </div>
            )}

            {/* No match overlay */}
            {status === "no-match" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="bg-red-600 text-white rounded-2xl px-8 py-6 text-center shadow-2xl">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg font-bold">Not Recognized</p>
                  <p className="text-sm mt-1">Please enroll or try again</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleScan}
              disabled={status === "loading" || status === "scanning"}
              className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <Camera className="w-5 h-5" />
              Scan & Clock
            </button>
            <button
              onClick={openEnrollMode}
              disabled={status === "loading"}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              Enroll
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
              Status
            </h3>
            <div className="flex items-start gap-3">
              {statusIcon()}
              <p className="text-sm text-foreground leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Enrollment Panel */}
          {enrollMode && (
            <div className="bg-surface border border-blue-500/30 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                Face Enrollment
              </h3>
              <p className="text-xs text-muted">
                Select a personnel, look at the camera, and click Capture to
                enroll their face.
              </p>
              <select
                value={selectedPersonnel}
                onChange={(e) => setSelectedPersonnel(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">— Select Personnel —</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.last_name}, {p.first_name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleEnroll}
                  disabled={!selectedPersonnel}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Capture & Enroll
                </button>
                <button
                  onClick={() => setEnrollMode(false)}
                  className="px-4 bg-background border border-border text-foreground text-sm font-medium py-2 rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
              {enrollMsg && (
                <p
                  className={`text-xs ${enrollMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
                >
                  {enrollMsg}
                </p>
              )}
            </div>
          )}

          {/* Enrolled Faces Summary */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
              Enrolled Faces
            </h3>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted">No faces enrolled yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {enrollments.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <UserCheck className="w-4 h-4 text-success shrink-0" />
                    <span>
                      {e.personnel
                        ? `${e.personnel.last_name}, ${e.personnel.first_name}`
                        : e.per_id}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Last Clock Result */}
          {clockResult && (
            <div
              className={`border rounded-xl p-5 ${
                clockResult.success
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                Last Clock
              </h3>
              <p className="text-foreground font-semibold">
                {clockResult.name}
              </p>
              <p className="text-sm text-muted">
                {clockResult.slotLabel} — {clockResult.time}
              </p>
              {clockResult.error && (
                <p className="text-xs text-red-400 mt-1">{clockResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeClock;
