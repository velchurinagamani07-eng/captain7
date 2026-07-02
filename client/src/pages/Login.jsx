import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BrandMark } from "../components/common/BrandMark.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login, loginWithGoogle, demoSignIn } = useAuth();
  const [toast, setToast] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const submit = async (values) => {
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        showToast("Wrong email or password");
      } else if (err.code === "auth/user-not-found") {
        showToast("No account found with this email");
      } else {
        showToast(err.message || "Login failed");
      }
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message || "Google login failed");
    }
  };

  const demo = () => {
    demoSignIn("admin");
    navigate(from, { replace: true });
  };

  return (
    <section className="grid min-h-screen place-items-center bg-captain-black px-4 py-20">
      <form onSubmit={handleSubmit(submit)} className="w-full max-w-md rounded-lg border border-captain-gold/30 bg-captain-card p-6 shadow-gold">
        <div className="mb-7 flex justify-center"><BrandMark /></div>
        <h1 className="font-display text-5xl text-white">ADMIN LOGIN</h1>
        <p className="mt-2 text-sm text-white/55">Sign in to access Captain 7 Admin Panel.</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Email</span>
            <input {...register("email", { required: true })} className="form-input" placeholder="admin@captain7.com" />
          </label>
          <label className="grid gap-2">
            <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Password</span>
            <input {...register("password", { required: true })} type="password" className="form-input" placeholder="Password" />
          </label>
        </div>
        <Button type="submit" className="mt-6 w-full">Login</Button>
        <div className="mt-3 grid gap-3">
          <Button type="button" variant="secondary" onClick={handleGoogle}>Continue with Google</Button>
          {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true") && (
            <Button type="button" variant="ghost" onClick={demo}>Demo Admin Login</Button>
          )}
        </div>
      </form>
      <Toast message={toast} />
    </section>
  );
}