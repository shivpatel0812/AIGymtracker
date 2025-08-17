import { getUserPreferences } from './agentMemory';

export interface GoalAwareAnalysisOptions {
  includeGoalContext: boolean;
  analysisType: 'workout' | 'nutrition' | 'comprehensive';
  timeframe: string;
}

export const enhanceAnalysisWithGoals = async (
  originalAnalysis: any,
  options: GoalAwareAnalysisOptions
): Promise<{
  analysis: any;
  goalSpecificInsights: string[];
  recommendations: string[];
}> => {
  const preferences = await getUserPreferences();
  const userGoal = preferences?.fitnessGoals;
  
  if (!userGoal || !options.includeGoalContext) {
    return {
      analysis: originalAnalysis,
      goalSpecificInsights: [],
      recommendations: []
    };
  }

  const goalSpecificInsights: string[] = [];
  const recommendations: string[] = [];

  // Lean muscle goal analysis enhancements
  if (userGoal.description?.includes('lean') && userGoal.description?.includes('muscle')) {
    if (options.analysisType === 'workout') {
      goalSpecificInsights.push(
        '🎯 **Lean Muscle Focus**: Your workout analysis has been filtered for body recomposition goals',
        '💪 **Strength Metrics**: Tracking strength maintenance/gains during your cut',
        '🔥 **Metabolic Efficiency**: Evaluating calorie burn vs muscle preservation ratio'
      );
      
      recommendations.push(
        'Prioritize compound movements (squats, deadlifts, bench press)',
        'Maintain 70-85% of your max strength during cutting phases',
        'Include 2-3 metabolic finishers per week for enhanced fat loss',
        'Track body composition changes, not just scale weight'
      );
    }
    
    if (options.analysisType === 'nutrition') {
      goalSpecificInsights.push(
        '🍽️ **Recomposition Nutrition**: Analysis optimized for simultaneous fat loss and muscle preservation',
        '🥩 **Protein Priority**: Elevated protein targets for lean mass retention',
        '⚡ **Nutrient Timing**: Pre/post workout nutrition timing evaluation'
      );
      
      recommendations.push(
        'Target 1.2-1.4g protein per lb bodyweight during cutting',
        'Time 25-30g protein within 2 hours of training',
        'Maintain moderate carbs around workouts for performance',
        'Consider 20-25% caloric deficit maximum for body recomposition'
      );
    }
    
    if (options.analysisType === 'comprehensive') {
      goalSpecificInsights.push(
        '📊 **Body Recomposition Dashboard**: All metrics filtered through lean muscle lens',
        '🔄 **Progress Synergy**: Workout, nutrition, and recovery alignment for your goal',
        '📈 **Trend Analysis**: Long-term body composition trajectory evaluation'
      );
      
      recommendations.push(
        'Focus on progress photos and body measurements over scale weight',
        'Maintain consistent training intensity despite caloric deficit',
        'Plan periodic diet breaks every 6-8 weeks for metabolic health',
        'Track strength benchmarks monthly to ensure muscle preservation'
      );
    }
  }

  // Add other goal types as needed
  if (userGoal.primaryGoal === 'lose_weight') {
    goalSpecificInsights.push('📉 **Weight Loss Focus**: Analysis optimized for sustainable fat loss');
    recommendations.push('Aim for 1-2 lbs per week weight loss for best adherence');
  }

  if (userGoal.primaryGoal === 'gain_muscle') {
    goalSpecificInsights.push('📈 **Muscle Building Focus**: Analysis optimized for lean mass gains');
    recommendations.push('Target 0.5-1 lb per week weight gain in surplus phases');
  }

  if (userGoal.primaryGoal === 'strength') {
    goalSpecificInsights.push('💪 **Strength Focus**: Analysis optimized for performance gains');
    recommendations.push('Prioritize progressive overload and recovery metrics');
  }

  return {
    analysis: {
      ...originalAnalysis,
      goalContext: {
        userGoal: userGoal.description || userGoal.primaryGoal,
        setAt: userGoal.setAt,
        analysisEnhanced: true
      }
    },
    goalSpecificInsights,
    recommendations
  };
};

export const getGoalAwareWorkoutRecommendation = async (
  baseRecommendation: string
): Promise<string> => {
  const preferences = await getUserPreferences();
  const userGoal = preferences?.fitnessGoals;
  
  if (!userGoal?.description) return baseRecommendation;
  
  if (userGoal.description.includes('lean') && userGoal.description.includes('muscle')) {
    return `${baseRecommendation}\n\n🎯 **Aligned with your lean + strong goal:**\n• This workout balances strength training with metabolic stress\n• Perfect for body recomposition (building muscle while losing fat)\n• Emphasizes compound movements for maximum efficiency`;
  }
  
  return baseRecommendation;
};

export const getGoalAwareNutritionAdvice = async (
  baseAdvice: string
): Promise<string> => {
  const preferences = await getUserPreferences();
  const userGoal = preferences?.fitnessGoals;
  
  if (!userGoal?.description) return baseAdvice;
  
  if (userGoal.description.includes('lean') && userGoal.description.includes('muscle')) {
    return `${baseAdvice}\n\n🎯 **Tailored for lean muscle goals:**\n• Higher protein (1.2-1.4g per lb) for muscle preservation during deficit\n• Strategic carb timing around workouts for performance\n• Moderate deficit (20-25%) to allow simultaneous muscle building`;
  }
  
  return baseAdvice;
};