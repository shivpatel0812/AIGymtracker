import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { HydrationEntry } from "../types";

export const saveHydrationEntry = async (hydrationEntry: HydrationEntry): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const hydrationData = { ...hydrationEntry };
    delete hydrationData.id;

    const docRef = doc(db, `users/${uid}/hydration`, hydrationEntry.date);
    await setDoc(docRef, hydrationData);

    return docRef.id;
  } catch (error) {
    console.error("Error saving hydration entry:", error);
    throw error;
  }
};

export const getTodayHydration = async (date: string): Promise<HydrationEntry | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, `users/${uid}/hydration`, date);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as HydrationEntry;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting hydration entry:", error);
    throw error;
  }
};

export const getHydrationHistory = async (limitCount: number = 30): Promise<HydrationEntry[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const q = query(
      collection(db, `users/${uid}/hydration`),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as HydrationEntry[];
  } catch (error) {
    console.error("Error getting hydration history:", error);
    throw error;
  }
};