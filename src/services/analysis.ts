import { auth } from "./firebase";

const API_BASE_URL = "http://localhost:8080/api/analysis";

export interface AnalysisRequest {
  userId: string;
  dateRange: string; // "7days", "30days", "90days", "all"
}

export interface AnalysisResponse {
  success: boolean;
  message?: string;
  analysis?: any;
  error?: string;
}

export async function getComprehensiveAnalysis(dateRange: string = "30days"): Promise<AnalysisResponse> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/comprehensive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: uid,
      dateRange: dateRange,
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getNutritionAnalysis(dateRange: string = "30days"): Promise<AnalysisResponse> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/nutrition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: uid,
      dateRange: dateRange,
    }),
  });

  if (!response.ok) {
    throw new Error(`Nutrition analysis failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getWorkoutAnalysis(dateRange: string = "30days"): Promise<AnalysisResponse> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/workout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: uid,
      dateRange: dateRange,
    }),
  });

  if (!response.ok) {
    throw new Error(`Workout analysis failed: ${response.statusText}`);
  }

  return response.json();
}

export async function testDataRetrieval(dateRange: string = "30days"): Promise<any> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/test-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: uid,
      dateRange: dateRange,
    }),
  });

  if (!response.ok) {
    throw new Error(`Data retrieval failed: ${response.statusText}`);
  }

  return response.json();
}