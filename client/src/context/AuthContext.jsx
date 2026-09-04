import { createContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, hasFirebaseConfig } from "../firebase/config.js";

export const AuthContext = createContext(null);

const demoUser = {
  uid: "demo-user",
  name: "Captain Guest",
  email: "guest@captain7.local",
  phone: "",
  role: "user",
  loyaltyPoints: 70
};

async function syncFirebaseUser(firebaseUser) {
  const email = (firebaseUser.email || "").toLowerCase().trim();
  const isAdminEmail = 
    email === "admin@captian7.com" || 
    email === "admin@captain7.com" ||
    email === "admin@captain7.in" ||
    email === "admin@captian7.in" ||
    email === "admin@captain7.local" ||
    email.startsWith("admin@");

  const baseProfile = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Captain User",
    email: firebaseUser.email || "",
    phone: firebaseUser.phoneNumber || "",
    photoURL: firebaseUser.photoURL || "",
    role: isAdminEmail ? "admin" : "user",
    loyaltyPoints: 0
  };

  if (!db) return baseProfile;

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);
    const existing = snapshot.exists() ? snapshot.data() : {};
    
    // Determine accurate role
    let role = "user";
    if (isAdminEmail || existing.role === "admin") {
      role = "admin";
    } else if (existing.role === "worker") {
      role = "worker";
    }

    const loyaltyPoints = existing.loyaltyPoints ?? 0;

    if (!snapshot.exists()) {
      await setDoc(
        userRef,
        {
          uid: firebaseUser.uid,
          name: baseProfile.name,
          email: baseProfile.email,
          phone: baseProfile.phone,
          photoURL: baseProfile.photoURL,
          role,
          loyaltyPoints,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ).catch(() => null);
    }

    return {
      ...baseProfile,
      ...existing,
      role,
      loyaltyPoints,
      email: baseProfile.email,
      photoURL: baseProfile.photoURL
    };
  } catch {
    return baseProfile;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(hasFirebaseConfig));

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }
      const profile = await syncFirebaseUser(firebaseUser);
      if (mounted) {
        setUser(profile);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      isWorker: user?.role === "worker",
      async getToken() {
        if (!hasFirebaseConfig || !auth?.currentUser) return "";
        return getIdToken(auth.currentUser);
      },
      demoSignIn(role = "user") {
        const email = role === "admin" ? "admin@captain7.local" : role === "worker" ? "worker@captain7.local" : demoUser.email;
        const profile = { ...demoUser, role, email, name: role === "admin" ? "Admin Demo" : role === "worker" ? "Worker Demo" : "Captain Guest" };
        setUser(profile);
        return profile;
      },
      async login(email, password) {
        const cleanEmail = (email || "").trim().toLowerCase();
        if (!hasFirebaseConfig || !auth) {
          const role = cleanEmail.includes("admin") ? "admin" : cleanEmail.includes("worker") ? "worker" : "user";
          const profile = { ...demoUser, email: cleanEmail, role };
          setUser(profile);
          setLoading(false);
          return profile;
        }

        setLoading(true);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          const profile = await syncFirebaseUser(userCredential.user);
          setUser(profile);
          setLoading(false);
          return profile;
        } catch (err) {
          setLoading(false);
          throw err;
        }
      },
      async register(email, password) {
        const cleanEmail = (email || "").trim().toLowerCase();
        if (!hasFirebaseConfig || !auth) {
          const profile = { ...demoUser, email: cleanEmail };
          setUser(profile);
          return profile;
        }
        setLoading(true);
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const profile = await syncFirebaseUser(userCredential.user);
          setUser(profile);
          setLoading(false);
          return profile;
        } catch (err) {
          setLoading(false);
          throw err;
        }
      },
      async loginWithGoogle() {
        if (!hasFirebaseConfig || !auth || !googleProvider) {
          setUser(demoUser);
          return demoUser;
        }
        setLoading(true);
        try {
          const userCredential = await signInWithPopup(auth, googleProvider);
          const profile = await syncFirebaseUser(userCredential.user);
          setUser(profile);
          setLoading(false);
          return profile;
        } catch (err) {
          setLoading(false);
          throw err;
        }
      },
      async logout() {
        if (hasFirebaseConfig && auth) await signOut(auth);
        setUser(null);
        setLoading(false);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
