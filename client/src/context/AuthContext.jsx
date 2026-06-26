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
  const baseProfile = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Captain User",
    email: firebaseUser.email || "",
    phone: firebaseUser.phoneNumber || "",
    photoURL: firebaseUser.photoURL || "",
    role: "user",
    loyaltyPoints: 0
  };

  if (!db) return baseProfile;

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);
    const existing = snapshot.exists() ? snapshot.data() : {};
    const role = existing.role || "user";
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
      async getToken() {
        if (!hasFirebaseConfig || !auth?.currentUser) return "";
        return getIdToken(auth.currentUser);
      },
      demoSignIn(role = "user") {
        setUser({ ...demoUser, role, email: role === "admin" ? "admin@captain7.local" : demoUser.email });
      },
      async login(email, password) {
        if (!hasFirebaseConfig || !auth) {
          setUser({ ...demoUser, email, role: email.includes("admin") ? "admin" : "user" });
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
      },
      async register(email, password) {
        if (!hasFirebaseConfig || !auth) {
          setUser({ ...demoUser, email });
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async loginWithGoogle() {
        if (!hasFirebaseConfig || !auth || !googleProvider) {
          setUser(demoUser);
          return;
        }
        await signInWithPopup(auth, googleProvider);
      },
      async logout() {
        if (hasFirebaseConfig && auth) await signOut(auth);
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
