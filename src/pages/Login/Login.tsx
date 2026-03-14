import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuthStore, useSettingsStore } from "@/store";
import { useResolvedAvatarUrl } from "@/hooks/useResolvedAvatarUrl";
import { cn } from "@/lib/utils";
import { Lightbulb, AlertCircle } from "lucide-react";
import LightRays from "@/components/LightRays/LightRays";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const systemLogo = useSettingsStore((state) => state.systemLogo);
  const systemLogoPath = useSettingsStore((state) => state.systemLogoPath);
  const resolvedLogoUrl = useResolvedAvatarUrl(systemLogoPath, "system_logo");
  const logoSrc = resolvedLogoUrl || systemLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate("/dashboard");
    } else {
      // Error is already set in the store, just display a default message
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Full-screen LightRays background */}
      <div className="absolute inset-0 z-0 bg-[#1a0000]">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ff4444"
          raysSpeed={1}
          lightSpread={0.8}
          rayLength={5}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={0.6}
          saturation={1.2}
        />
      </div>

      {/* Left Section - Logo */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center z-10">
        <div className="relative z-10 flex flex-col items-center gap-8 px-12">
          {logoSrc && (
            <img
              src={logoSrc}
              alt="LGU Logo"
              className="w-72 h-72 object-contain drop-shadow-2xl rounded-full bg-white/10 p-4"
            />
          )}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-3">
              LGU IMS System
            </h2>
            <p className="text-lg text-white/70 max-w-sm">
              Integrated Management System for Local Government Units
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        {/* Gradient overlay: transparent maroon on left edge fading to white */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/85 to-white/95 backdrop-blur-[2px]" />
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo - shown on small screens */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {logoSrc && (
              <img
                src={logoSrc}
                alt="LGU Logo"
                className="w-28 h-28 object-contain mb-4 rounded-full"
              />
            )}
            <h1 className="text-3xl font-bold text-[#7a1a1a]">LGU IMS System</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-[#7a1a1a]">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-900"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className={cn(
                  "w-full px-4 py-3.5 border border-gray-300 rounded-lg text-sm",
                  "bg-white text-gray-900 placeholder:text-gray-400",
                  "transition-all duration-200",
                  "focus:outline-none focus:border-[#7a1a1a] focus:ring-2 focus:ring-[#7a1a1a]/10",
                )}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-900"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className={cn(
                  "w-full px-4 py-3.5 border border-gray-300 rounded-lg text-sm",
                  "bg-white text-gray-900 placeholder:text-gray-400",
                  "transition-all duration-200",
                  "focus:outline-none focus:border-[#7a1a1a] focus:ring-2 focus:ring-[#7a1a1a]/10",
                )}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              className={cn(
                "w-full py-3.5 mt-2 rounded-lg text-base font-semibold",
                "bg-[#7a1a1a] text-white",
                "transition-all duration-200",
                "hover:bg-[#5c1313] hover:-translate-y-0.5 hover:shadow-xl",
                "active:translate-y-0",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
              )}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#7a1a1a] mb-2">
              <Lightbulb className="w-4 h-4" />
              <span>Getting Started:</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Use your Supabase account credentials to login. If you don't have
              an account, contact your administrator.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#7a1a1a] hover:underline transition-colors"
              >
                Request an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
