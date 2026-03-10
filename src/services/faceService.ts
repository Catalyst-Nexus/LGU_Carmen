import * as faceapi from "@vladmandic/face-api";
import { supabase, isSupabaseConfigured } from "./supabase";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FaceEnrollment {
  id: string;
  per_id: string;
  descriptor: number[];
  enrollment_photo_path: string;
  created_at: string;
  personnel?: {
    first_name: string;
    last_name: string;
    profile_photo_path: string | null;
  };
}

export interface MatchResult {
  per_id: string;
  name: string;
  distance: number;
  enrollment: FaceEnrollment;
}

export interface ClockResult {
  success: boolean;
  type: 1 | 2;
  slotLabel: string;
  name: string;
  time: string;
  error?: string;
}

// ── Model Loading ────────────────────────────────────────────────────────────

let modelsLoaded = false;

/**
 * Load face-api.js models from /models directory in public folder.
 * Models needed: tinyFaceDetector, faceLandmark68Net, faceRecognitionNet.
 * Copy model files from node_modules/@vladmandic/face-api/model/ to public/models/
 */
export const loadFaceModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  const MODEL_URL = "/models";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
};

// ── Detection ────────────────────────────────────────────────────────────────

/**
 * Detect a single face from a video element and return its 128-D descriptor.
 */
export const detectFace = async (
  video: HTMLVideoElement,
): Promise<Float32Array | null> => {
  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
    )
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
};

// ── Enrollment CRUD ──────────────────────────────────────────────────────────

/**
 * Fetch all enrolled face descriptors (with personnel name).
 */
export const fetchEnrollments = async (): Promise<FaceEnrollment[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await supabase
    .schema("hr")
    .from("face_enrollment")
    .select(
      `id, per_id, descriptor, enrollment_photo_path, created_at,
       personnel:per_id ( first_name, last_name, profile_photo_path )`,
    );

  if (error) {
    console.error("Error fetching face enrollments:", error);
    return [];
  }
  return (data ?? []) as unknown as FaceEnrollment[];
};

/**
 * Enroll (or re-enroll) a face for a personnel member.
 * Uploads a snapshot to the face_enrollments bucket and stores the descriptor.
 */
export const enrollFace = async (
  perId: string,
  descriptor: Float32Array,
  snapshot: Blob,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };

  // Upload enrollment photo
  const photoPath = `${perId}/enrollment.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("face_enrollments")
    .upload(photoPath, snapshot, { upsert: true, contentType: "image/jpeg" });

  if (uploadError) {
    console.error("Face enrollment photo upload error:", uploadError);
    return { success: false, error: uploadError.message };
  }

  // Upsert descriptor into hr.face_enrollment
  const { error: dbError } = await supabase
    .schema("hr")
    .from("face_enrollment")
    .upsert(
      {
        per_id: perId,
        descriptor: Array.from(descriptor),
        enrollment_photo_path: photoPath,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "per_id" },
    );

  if (dbError) {
    console.error("Face enrollment DB error:", dbError);
    return { success: false, error: dbError.message };
  }

  return { success: true };
};

/**
 * Delete a face enrollment.
 */
export const deleteEnrollment = async (
  perId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };

  // Delete photo from storage
  await supabase.storage
    .from("face_enrollments")
    .remove([`${perId}/enrollment.jpg`]);

  // Delete DB row
  const { error } = await supabase
    .schema("hr")
    .from("face_enrollment")
    .delete()
    .eq("per_id", perId);

  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ── Matching ─────────────────────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.5; // Euclidean distance; lower = stricter

/**
 * Match a captured descriptor against all enrolled faces.
 * Returns the closest match if within threshold, or null.
 */
export const matchFace = (
  descriptor: Float32Array,
  enrollments: FaceEnrollment[],
): MatchResult | null => {
  let best: MatchResult | null = null;

  for (const enrollment of enrollments) {
    const enrolled = new Float32Array(enrollment.descriptor);
    const distance = faceapi.euclideanDistance(descriptor, enrolled);

    if (distance < MATCH_THRESHOLD && (!best || distance < best.distance)) {
      const name = enrollment.personnel
        ? `${enrollment.personnel.last_name}, ${enrollment.personnel.first_name}`
        : "Unknown";

      best = { per_id: enrollment.per_id, name, distance, enrollment };
    }
  }

  return best;
};

// ── Time Slot Resolution ─────────────────────────────────────────────────────

/**
 * Determine which time_record slot to fill based on current time (CSC rules).
 * AM: 6:00–11:59 → in1 first, then out1
 * PM: 12:00–17:59 → in2 first, then out2
 */
export type TimeSlot = "in1" | "out1" | "in2" | "out2";

const SLOT_LABELS: Record<TimeSlot, string> = {
  in1: "AM Time-In",
  out1: "AM Time-Out",
  in2: "PM Time-In",
  out2: "PM Time-Out",
};

export const getSlotLabel = (slot: TimeSlot): string => SLOT_LABELS[slot];

interface ExistingRecord {
  in1: string | null;
  out1: string | null;
  in2: string | null;
  out2: string | null;
}

export const resolveTimeSlot = (
  now: Date,
  existing: ExistingRecord | null,
): TimeSlot | null => {
  const hour = now.getHours();

  if (hour < 12) {
    // Morning
    if (!existing?.in1) return "in1";
    if (!existing?.out1) return "out1";
    return null; // Both AM slots filled
  } else {
    // Afternoon
    if (!existing?.in2) return "in2";
    if (!existing?.out2) return "out2";
    return null; // Both PM slots filled
  }
};

// ── Clock In/Out ─────────────────────────────────────────────────────────────

/**
 * Clock a matched person with the chosen time_identifier (1=IN, 2=OUT)
 * and time_slot_id. Inserts a new row into hr.time_record.
 * The DB trigger auto-calculates total_hours when time_identifier=2.
 */
export const clockPerson = async (
  perId: string,
  name: string,
  timeIdentifier: 1 | 2,
  timeSlotId: string,
  slotLabel: string,
): Promise<ClockResult> => {
  if (!isSupabaseConfigured() || !supabase)
    return {
      success: false,
      type: 1,
      slotLabel: "",
      name,
      time: "",
      error: "Supabase not configured",
    };

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];

  const row: Record<string, unknown> = {
    per_id: perId,
    date: today,
    time_slot_id: timeSlotId,
    time_identifier: timeIdentifier,
  };

  // Store time in the correct column
  if (timeIdentifier === 1) {
    row.in1 = timeStr;
  } else {
    row.out1 = timeStr;
  }

  const { error } = await supabase
    .schema("hr")
    .from("time_record")
    .insert([row]);

  if (error) {
    console.error("Clock error:", error);
    return {
      success: false,
      type: timeIdentifier,
      slotLabel,
      name,
      time: timeStr,
      error: error.message,
    };
  }

  return {
    success: true,
    type: timeIdentifier,
    slotLabel: `${timeIdentifier === 1 ? "IN" : "OUT"} — ${slotLabel}`,
    name,
    time: timeStr,
  };
};

// ── Camera Helpers ───────────────────────────────────────────────────────────

/**
 * Capture a JPEG snapshot from a video element.
 */
export const captureSnapshot = (video: HTMLVideoElement): Blob | null => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);

  // Convert to blob synchronously via toDataURL → fetch is async,
  // so we return the canvas for the caller to handle
  return null; // Caller should use captureSnapshotAsync
};

export const captureSnapshotAsync = (
  video: HTMLVideoElement,
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
  });
};
