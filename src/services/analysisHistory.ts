import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface SavedAnalysis {
  id: string;
  userId: string;
  analysisType: string;
  analysisData: any;
  dateRange: string;
  createdAt: Date;
  title?: string;
}

export class AnalysisHistoryService {
  private static getCollectionRef() {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return collection(db, "users", user.uid, "analysisHistory");
  }

  static async saveAnalysis(
    analysisType: string,
    analysisData: any,
    dateRange: string,
    title?: string
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const analysisDoc = {
        userId: user.uid,
        analysisType,
        analysisData,
        dateRange,
        title: title || `${analysisType} Analysis`,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.getCollectionRef(), analysisDoc);
      console.log("✅ Analysis saved with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error saving analysis:", error);
      throw error;
    }
  }

  static async getAnalysisHistory(
    limitCount: number = 10
  ): Promise<SavedAnalysis[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const q = query(
        this.getCollectionRef(),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const analyses: SavedAnalysis[] = [];

      querySnapshot.forEach((doc) => {
        const data: any = doc.data();
        console.log(`🔍 Retrieved analysis ${doc.id}:`, JSON.stringify(data, null, 2));
        analyses.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        } as SavedAnalysis);
      });

      console.log(`✅ Retrieved ${analyses.length} saved analyses`);
      return analyses;
    } catch (error) {
      console.error("❌ Error retrieving analysis history:", error);
      throw error;
    }
  }

  static async deleteAnalysis(analysisId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      await deleteDoc(doc(this.getCollectionRef(), analysisId));
      console.log("✅ Analysis deleted:", analysisId);
    } catch (error) {
      console.error("❌ Error deleting analysis:", error);
      throw error;
    }
  }

  static async updateAnalysisTitle(
    analysisId: string,
    newTitle: string
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      await updateDoc(doc(this.getCollectionRef(), analysisId), {
        title: newTitle,
      });
      console.log("✅ Analysis title updated:", analysisId);
    } catch (error) {
      console.error("❌ Error updating analysis title:", error);
      throw error;
    }
  }
}
