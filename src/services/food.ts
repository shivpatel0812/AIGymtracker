import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";
import { FoodEntry } from "../types";

export async function uploadFoodImageAsync(
  uri: string
): Promise<{ url: string; path: string }> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storagePath = `users/${uid}/food/${filename}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const downloadUrl = await getDownloadURL(storageRef);

  return { url: downloadUrl, path: storagePath };
}

export async function saveFoodEntry(
  entry: Omit<FoodEntry, "id">
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const docRef = await addDoc(
    collection(db, `users/${uid}/foodEntries`),
    entry
  );
  return docRef.id;
}

export async function getFoodEntriesByDate(date: string): Promise<FoodEntry[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const q = query(
    collection(db, `users/${uid}/foodEntries`),
    where("createdAtISO", ">=", startOfDay),
    where("createdAtISO", "<=", endOfDay),
    orderBy("createdAtISO", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FoodEntry[];
}

export async function getFoodEntries(limitCount: number = 50): Promise<FoodEntry[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const q = query(
    collection(db, `users/${uid}/foodEntries`),
    orderBy("createdAtISO", "desc"),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FoodEntry[];
}
