import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuthStore, useSettingsStore } from "@/store";
import { useResolvedAvatarUrl } from "@/hooks/useResolvedAvatarUrl";
import { cn } from "@/lib/utils";
import { Lightbulb, AlertCircle } from "lucide-react";

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
      {/* Left Section - Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
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
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo - shown on small screens */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {logoSrc && (
              <img
                src={logoSrc}
                alt="LGU Logo"
                className="w-28 h-28 object-contain mb-4 rounded-full"
              />
            )}
            <h1 className="text-3xl font-bold text-primary">LGU IMS System</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
            <p className="text-muted mt-2">Sign in to your account to continue</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className={cn(
                  "w-full px-4 py-3.5 border border-border rounded-lg text-sm",
                  "bg-surface text-foreground placeholder:text-muted",
                  "transition-all duration-200",
                  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
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
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className={cn(
                  "w-full px-4 py-3.5 border border-border rounded-lg text-sm",
                  "bg-surface text-foreground placeholder:text-muted",
                  "transition-all duration-200",
                  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
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
              <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3 text-sm text-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              className={cn(
                "w-full py-3.5 mt-2 rounded-lg text-base font-semibold",
                "bg-primary text-white",
                "transition-all duration-200",
                "hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-xl",
                "active:translate-y-0",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
              )}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-background rounded-lg border border-border">
            <div className="flex items-center gap-2 font-semibold text-sm text-primary mb-2">
              <Lightbulb className="w-4 h-4" />
              <span>Getting Started:</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Use your Supabase account credentials to login. If you don't have
              an account, contact your administrator.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Need help?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline transition-colors"
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
