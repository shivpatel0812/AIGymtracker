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
import { MacroEntry } from "../types";

export const saveMacroEntry = async (macroEntry: MacroEntry): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const macroData = { ...macroEntry };
    delete macroData.id;

    const docRef = doc(db, `users/${uid}/macros`, macroEntry.date);
    await setDoc(docRef, macroData);

    return docRef.id;
  } catch (error) {
    console.error("Error saving macro entry:", error);
    throw error;
  }
};

export const getTodayMacros = async (date: string): Promise<MacroEntry | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, `users/${uid}/macros`, date);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MacroEntry;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting macro entry:", error);
    throw error;
  }
};

export const getMacroHistory = async (limitCount: number = 30): Promise<MacroEntry[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const q = query(
      collection(db, `users/${uid}/macros`),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MacroEntry[];
  } catch (error) {
    console.error("Error getting macro history:", error);
    throw error;
  }
};