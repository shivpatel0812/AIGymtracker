import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { ComprehensiveUserProfile } from "../types";
import { cleanForFirestore } from "../utils/firestore";

export const saveComprehensiveProfile = async (
  profile: ComprehensiveUserProfile
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const cleanProfile = cleanForFirestore({
      ...profile,
      profileCompleteness: {
        ...profile.profileCompleteness,
        lastUpdated: new Date().toISOString(),
        overallCompleteness: calculateCompleteness(profile),
      },
    });

    const docRef = doc(db, `users/${uid}/profile`, 'comprehensive');
    await setDoc(docRef, cleanProfile, { merge: true });
  } catch (error) {
    console.error("Error saving comprehensive profile:", error);
    throw error;
  }
};

export const getComprehensiveProfile = async (): Promise<ComprehensiveUserProfile | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const docRef = doc(db, `users/${uid}/profile`, 'comprehensive');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ComprehensiveUserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting comprehensive profile:", error);
    throw error;
  }
};

export const updateComprehensiveProfileSection = async (
  section: keyof ComprehensiveUserProfile,
  data: any
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const cleanData = cleanForFirestore({
      [section]: data,
      profileCompleteness: {
        lastUpdated: new Date().toISOString(),
      },
    });

    const docRef = doc(db, `users/${uid}/profile`, 'comprehensive');
    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating comprehensive profile section:", error);
    throw error;
  }
};

export const addExerciseResponse = async (response: {
  exercise: string;
  response: string;
  effectiveness: 'very_effective' | 'effective' | 'somewhat_effective' | 'not_effective';
  notes?: string;
}): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const profile = await getComprehensiveProfile();
    if (!profile) throw new Error("Profile not found");

    const updatedResponses = [...(profile.exerciseInsights.exerciseResponses || []), {
      ...response,
      addedAt: new Date().toISOString(),
    }];

    await updateComprehensiveProfileSection('exerciseInsights', {
      ...profile.exerciseInsights,
      exerciseResponses: updatedResponses,
    });
  } catch (error) {
    console.error("Error adding exercise response:", error);
    throw error;
  }
};

export const addFoodSensitivity = async (sensitivity: {
  food: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const profile = await getComprehensiveProfile();
    if (!profile) throw new Error("Profile not found");

    const updatedSensitivities = [...(profile.nutritionInsights.foodSensitivities || []), {
      ...sensitivity,
      addedAt: new Date().toISOString(),
    }];

    await updateComprehensiveProfileSection('nutritionInsights', {
      ...profile.nutritionInsights,
      foodSensitivities: updatedSensitivities,
    });
  } catch (error) {
    console.error("Error adding food sensitivity:", error);
    throw error;
  }
};

export const addGrowthPattern = async (pattern: {
  area: string;
  observation: string;
  timeframe: string;
  factors: string[];
}): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  try {
    const profile = await getComprehensiveProfile();
    if (!profile) throw new Error("Profile not found");

    const updatedPatterns = [...(profile.personalInsights.growthPatterns || []), {
      ...pattern,
      addedAt: new Date().toISOString(),
    }];

    await updateComprehensiveProfileSection('personalInsights', {
      ...profile.personalInsights,
      growthPatterns: updatedPatterns,
    });
  } catch (error) {
    console.error("Error adding growth pattern:", error);
    throw error;
  }
};

export const getProfileCompleteness = async (): Promise<{
  overall: number;
  sections: { [key: string]: boolean };
  missingCritical: string[];
}> => {
  try {
    const profile = await getComprehensiveProfile();
    if (!profile) {
      return {
        overall: 0,
        sections: {},
        missingCritical: ['All sections incomplete'],
      };
    }

    const sections = {
      basicInfo: isBasicInfoComplete(profile.basicInfo),
      fitnessGoals: isFitnessGoalsComplete(profile.fitnessGoals),
      exerciseInsights: isExerciseInsightsComplete(profile.exerciseInsights),
      nutritionInsights: isNutritionInsightsComplete(profile.nutritionInsights),
      personalInsights: isPersonalInsightsComplete(profile.personalInsights),
      brainDump: isBrainDumpComplete(profile.brainDumpSections),
      preferences: isPreferencesComplete(profile.preferences),
    };

    const completedSections = Object.values(sections).filter(Boolean).length;
    const overall = (completedSections / Object.keys(sections).length) * 100;

    const missingCritical = [];
    if (!sections.basicInfo) missingCritical.push('Basic Information');
    if (!sections.fitnessGoals) missingCritical.push('Fitness Goals');
    if (!sections.brainDump) missingCritical.push('Brain Dump Sections');

    return { overall, sections, missingCritical };
  } catch (error) {
    console.error("Error calculating profile completeness:", error);
    return { overall: 0, sections: {}, missingCritical: ['Error calculating'] };
  }
};

const calculateCompleteness = (profile: ComprehensiveUserProfile): number => {
  const sections = [
    isBasicInfoComplete(profile.basicInfo),
    isFitnessGoalsComplete(profile.fitnessGoals),
    isExerciseInsightsComplete(profile.exerciseInsights),
    isNutritionInsightsComplete(profile.nutritionInsights),
    isPersonalInsightsComplete(profile.personalInsights),
    isBrainDumpComplete(profile.brainDumpSections),
    isPreferencesComplete(profile.preferences),
  ];

  const completedSections = sections.filter(Boolean).length;
  return (completedSections / sections.length) * 100;
};

const isBasicInfoComplete = (basicInfo: ComprehensiveUserProfile['basicInfo']): boolean => {
  return !!(basicInfo.age && basicInfo.height && basicInfo.currentWeight && 
           basicInfo.activityLevel && basicInfo.fitnessExperience);
};

const isFitnessGoalsComplete = (goals: ComprehensiveUserProfile['fitnessGoals']): boolean => {
  return !!(goals.primaryGoal && goals.description);
};

const isExerciseInsightsComplete = (insights: ComprehensiveUserProfile['exerciseInsights']): boolean => {
  return insights.favoriteExercises.length > 0 || insights.exerciseResponses.length > 0;
};

const isNutritionInsightsComplete = (insights: ComprehensiveUserProfile['nutritionInsights']): boolean => {
  return insights.dietaryRestrictions.length > 0 || insights.foodSensitivities.length > 0 ||
         insights.nutritionPreferences.mealFrequency !== '3_meals';
};

const isPersonalInsightsComplete = (insights: ComprehensiveUserProfile['personalInsights']): boolean => {
  return insights.motivationTriggers.length > 0 || insights.growthPatterns.length > 0 ||
         insights.mentalAspects.relationshipWithFood.length > 0;
};

const isBrainDumpComplete = (brainDump: ComprehensiveUserProfile['brainDumpSections']): boolean => {
  const sections = Object.values(brainDump);
  return sections.some(section => section.length > 20); // At least one substantial entry
};

const isPreferencesComplete = (preferences: ComprehensiveUserProfile['preferences']): boolean => {
  return !!(preferences.communicationStyle && preferences.feedbackStyle && 
           preferences.coachingApproach);
};

export const generatePersonalizedRecommendations = async (): Promise<{
  workoutRecommendations: string[];
  nutritionRecommendations: string[];
  lifestyleRecommendations: string[];
  coachingAdjustments: string[];
}> => {
  try {
    const profile = await getComprehensiveProfile();
    if (!profile) {
      return {
        workoutRecommendations: ['Complete your profile for personalized recommendations'],
        nutritionRecommendations: ['Complete your profile for personalized recommendations'],
        lifestyleRecommendations: ['Complete your profile for personalized recommendations'],
        coachingAdjustments: ['Complete your profile for personalized recommendations'],
      };
    }

    const workoutRecommendations = generateWorkoutRecommendations(profile);
    const nutritionRecommendations = generateNutritionRecommendations(profile);
    const lifestyleRecommendations = generateLifestyleRecommendations(profile);
    const coachingAdjustments = generateCoachingAdjustments(profile);

    return {
      workoutRecommendations,
      nutritionRecommendations,
      lifestyleRecommendations,
      coachingAdjustments,
    };
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    return {
      workoutRecommendations: ['Error generating recommendations'],
      nutritionRecommendations: ['Error generating recommendations'],
      lifestyleRecommendations: ['Error generating recommendations'],
      coachingAdjustments: ['Error generating recommendations'],
    };
  }
};

const generateWorkoutRecommendations = (profile: ComprehensiveUserProfile): string[] => {
  const recommendations = [];
  
  const brainDump = profile.brainDumpSections.workoutExperiences.toLowerCase();
  
  if (brainDump.includes('dip') && brainDump.includes('tricep')) {
    recommendations.push('Prioritize dips for tricep development based on your positive response');
  }
  
  if (brainDump.includes('morning') && brainDump.includes('energy')) {
    recommendations.push('Schedule workouts in the morning to maximize energy levels');
  }
  
  if (brainDump.includes('volume') && brainDump.includes('legs')) {
    recommendations.push('Use higher volume training protocols for leg development');
  }

  if (profile.exerciseInsights.workoutPreferences.sessionDuration === '30min') {
    recommendations.push('Focus on compound movements and supersets for time efficiency');
  }

  return recommendations.length > 0 ? recommendations : ['Focus on progressive overload and consistency'];
};

const generateNutritionRecommendations = (profile: ComprehensiveUserProfile): string[] => {
  const recommendations = [];
  
  const brainDump = profile.brainDumpSections.nutritionExperiences.toLowerCase();
  
  if (brainDump.includes('carbs') && brainDump.includes('sleep')) {
    recommendations.push('Include carbs in evening meals to support sleep quality');
  }
  
  if (brainDump.includes('dairy') && brainDump.includes('bloat')) {
    recommendations.push('Limit or eliminate dairy products to reduce bloating');
  }
  
  if (brainDump.includes('intermittent fasting')) {
    recommendations.push('Consider intermittent fasting as a weight management strategy');
  }

  profile.nutritionInsights.foodSensitivities.forEach(sensitivity => {
    if (sensitivity.severity === 'severe') {
      recommendations.push(`Completely avoid ${sensitivity.food} due to severe reaction`);
    }
  });

  return recommendations.length > 0 ? recommendations : ['Focus on whole foods and adequate protein'];
};

const generateLifestyleRecommendations = (profile: ComprehensiveUserProfile): string[] => {
  const recommendations = [];

  if (profile.personalInsights.lifeCircumstances.workSchedule === 'shift_work') {
    recommendations.push('Adjust meal timing and sleep schedule to accommodate shift work');
  }

  if (profile.personalInsights.lifeCircumstances.familyCommitments === 'significant') {
    recommendations.push('Focus on efficient home workouts and meal prep strategies');
  }

  if (profile.personalInsights.mentalAspects.stressEating) {
    recommendations.push('Develop stress management techniques to prevent emotional eating');
  }

  return recommendations.length > 0 ? recommendations : ['Maintain consistency in sleep and meal timing'];
};

const generateCoachingAdjustments = (profile: ComprehensiveUserProfile): string[] => {
  const adjustments = [];

  if (profile.preferences.communicationStyle === 'analytical') {
    adjustments.push('Provide detailed explanations and scientific rationale for recommendations');
  }

  if (profile.preferences.feedbackStyle === 'gentle') {
    adjustments.push('Use supportive language and focus on positive reinforcement');
  }

  if (profile.preferences.coachingApproach === 'flexible') {
    adjustments.push('Offer multiple options and adapt plans based on daily circumstances');
  }

  return adjustments.length > 0 ? adjustments : ['Maintain motivational and supportive communication'];
};