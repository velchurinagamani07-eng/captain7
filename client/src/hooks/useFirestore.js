import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase/config.js";

export function useCollection(collectionName, fallback = [], options = {}) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(Boolean(hasFirebaseConfig && options.live));
  const [error, setError] = useState("");

  const fallbackKey = useMemo(() => JSON.stringify(fallback), [fallback]);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setData(JSON.parse(fallbackKey));
      setLoading(false);
      return undefined;
    }

    const ref = collection(db, collectionName);
    const filters = (options.where || []).map(([field, operator, value]) => where(field, operator, value));
    const constraints = [...filters];
    if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || "asc"));
    const q = constraints.length ? query(ref, ...constraints) : ref;

    if (options.live) {
      setLoading(true);
      return onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          setData(docs.length ? docs : JSON.parse(fallbackKey));
          setLoading(false);
        },
        (snapshotError) => {
          setError(snapshotError.message);
          setData(JSON.parse(fallbackKey));
          setLoading(false);
        }
      );
    }

    let mounted = true;
    setLoading(true);
    getDocs(q)
      .then((snapshot) => {
        const docs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        if (mounted) setData(docs.length ? docs : JSON.parse(fallbackKey));
      })
      .catch((snapshotError) => {
        if (mounted) {
          setError(snapshotError.message);
          setData(JSON.parse(fallbackKey));
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [collectionName, options.orderBy, options.direction, options.live, JSON.stringify(options.where || []), fallbackKey]);

  return { data, loading, error };
}

export function useDocument(path, fallback = {}) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(Boolean(hasFirebaseConfig));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setData(fallback);
      setLoading(false);
      return;
    }

    const parts = path.split("/").filter(Boolean);
    let mounted = true;
    setLoading(true);
    getDoc(doc(db, ...parts))
      .then((snapshot) => {
        if (mounted && snapshot.exists()) setData({ id: snapshot.id, ...snapshot.data() });
      })
      .catch((snapshotError) => {
        if (mounted) {
          setError(snapshotError.message);
          setData(fallback);
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [path]);

  return { data, loading, error };
}
