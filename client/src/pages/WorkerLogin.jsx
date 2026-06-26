import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";
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
  const navigate = useNavigate();

  function triggerToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      triggerToast("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Fetch user document to check role
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === "worker") {
        triggerToast("Login successful!");
        navigate("/worker/dashboard");
      } else {
        // Log out because this user is not a worker
        await auth.signOut();
        triggerToast("Access Denied: Only workers can log in here.");
      }
    } catch (err) {
      triggerToast(err.message || "Authentication failed");
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
