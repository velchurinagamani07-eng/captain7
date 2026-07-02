import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase/config.js";
import { compressImage } from "../utils/compressImage.js";

const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export async function uploadToImgBB(file, onProgress, apiKey = IMGBB_KEY) {
  if (!apiKey) throw new Error("ImgBB API key is required");
  const { file: compressed } = await compressImage(file, 500, onProgress);
  const form = new FormData();
  form.append("image", compressed);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "ImgBB upload failed");
  return json.data.url;
}

export function useAdminCollection(collectionName, orderByField = "createdAt") {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const ref = collection(db, collectionName);
    const q = orderByField ? query(ref, orderBy(orderByField, "asc")) : ref;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [collectionName, orderByField]);

  const save = useCallback(async (id, payload) => {
    setSaving(true);
    try {
      const ref = doc(db, collectionName, id || crypto.randomUUID());
      const isNew = !id;
      if (isNew) {
        await setDoc(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else {
        await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
      }
    } finally {
      setSaving(false);
    }
  }, [collectionName]);

  const remove = useCallback(async (id) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, collectionName, id));
    } finally {
      setSaving(false);
    }
  }, [collectionName]);

  return { data, loading, saving, error, save, remove };
}
