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
import { StressEntry } from "../types";

export const saveStressEntry = async (stressEntry: StressEntry): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const stressData = { ...stressEntry };
    delete stressData.id;

    const docRef = doc(db, `users/${uid}/stress`, stressEntry.date);
    await setDoc(docRef, stressData);

    return docRef.id;
  } catch (error) {
    console.error("Error saving stress entry:", error);
    throw error;
  }
};

export const getTodayStress = async (date: string): Promise<StressEntry | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, `users/${uid}/stress`, date);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as StressEntry;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting stress entry:", error);
    throw error;
  }
};

export const getStressHistory = async (limitCount: number = 30): Promise<StressEntry[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const q = query(
      collection(db, `users/${uid}/stress`),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StressEntry[];
  } catch (error) {
    console.error("Error getting stress history:", error);
    throw error;
  }
};