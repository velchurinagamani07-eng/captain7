import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { BrandMark } from "../components/common/BrandMark.jsx";

export default function WorkerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const { login, logout, demoSignIn } = useAuth();
  const navigate = useNavigate();

  function triggerToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      triggerToast("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const profile = await login(cleanEmail, password);

      if (profile && (profile.role === "worker" || profile.role === "admin")) {
        triggerToast("Login successful!");
        navigate("/worker/dashboard", { replace: true });
      } else {
        await logout();
        triggerToast("Access Denied: This account is not registered as a worker.");
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        triggerToast("Invalid email or password");
      } else if (err.code === "auth/user-not-found") {
        triggerToast("No worker account found with this email");
      } else {
        triggerToast(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-captain-black px-4">
      <Card hover={false} className="w-full max-w-md space-y-6 border border-captain-gold/20 bg-captain-charcoal p-8 shadow-gold">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size="md" withText={false} />
          <h1 className="font-bebas text-4xl tracking-wider text-white">WORKER PORTAL</h1>
          <p className="text-sm text-white/52">Log in to view and manage your assigned deliveries.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input w-full"
              placeholder="worker@captain7.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : "Log In"}
          </Button>
        </form>
      </Card>
      <Toast message={toast} tone="green" />
    </div>
  );
}
