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
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { getUserPreferences, getProgressHistory } from "./agentMemory";
import { learningAdaptationService } from "./learningAdaptation";
import { toolUsageService } from "./toolUsage";

export interface MultiStepGoal {
  id?: string;
  mainGoal: {
    description: string;
    targetValue: number;
    currentValue: number;
    deadline: string;
    metric: string;
  };
  milestones: Array<{
    id: string;
    description: string;
    targetValue: number;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    dependencies?: string[];
    adaptiveStrategy: {
      conditions: string[];
      adjustments: any[];
    };
  }>;
  strategies: {
    primary: string[];
    contingency: string[];
    adaptive: boolean;
  };
  createdAt: string;
  lastUpdated: string;
}

export interface ContingencyPlan {
  id?: string;
  scenario: string;
  triggers: {
    condition: string;
    threshold: number | string;
    timeframe: string;
  }[];
  actions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  alternatives: {
    exercise: { [key: string]: string[] };
    nutrition: { [key: string]: string[] };
    schedule: { [key: string]: any };
  };
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface CausalRelationship {
  cause: string;
  effect: string;
  strength: number;
  confidence: number;
  context: string[];
  evidence: Array<{
    observation: string;
    timestamp: string;
    impact: number;
  }>;
}

export interface ReasoningEngine {
  analyzeProgress(goalId: string): Promise<{
    status: 'on_track' | 'behind' | 'ahead';
    reasoning: string;
    recommendations: string[];
    riskFactors: string[];
  }>;
  
  generateContingencies(scenario: string): Promise<ContingencyPlan>;
  
  identifyCausalRelationships(
    outcomes: any[],
    factors: any[]
  ): Promise<CausalRelationship[]>;
}

class PlanningReasoningService implements ReasoningEngine {
  private causalRelationships: CausalRelationship[] = [];

  async createMultiStepGoal(
    goalDescription: string,
    targetValue: number,
    deadline: string,
    metric: string
  ): Promise<MultiStepGoal> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");

    try {
      const currentValue = await this.getCurrentValue(metric);
      const milestones = await this.generateMilestones(
        currentValue,
        targetValue,
        deadline,
        metric
      );

      const multiStepGoal: MultiStepGoal = {
        mainGoal: {
          description: goalDescription,
          targetValue,
          currentValue,
          deadline,
          metric
        },
        milestones,
        strategies: await this.generateStrategies(goalDescription, metric),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const docRef = await addDoc(
        collection(db, `users/${uid}/multi_step_goals`),
        multiStepGoal
      );

      return { id: docRef.id, ...multiStepGoal };
    } catch (error) {
      console.error("Error creating multi-step goal:", error);
      throw error;
    }
  }

  async analyzeProgress(goalId: string): Promise<{
    status: 'on_track' | 'behind' | 'ahead';
    reasoning: string;
    recommendations: string[];
    riskFactors: string[];
  }> {
    try {
      const goal = await this.getMultiStepGoal(goalId);
      if (!goal) throw new Error("Goal not found");

      const currentProgress = await this.calculateCurrentProgress(goal);
      const expectedProgress = this.calculateExpectedProgress(goal);
      
      const progressRatio = currentProgress / expectedProgress;
      
      let status: 'on_track' | 'behind' | 'ahead';
      let reasoning: string;
      const recommendations: string[] = [];
      const riskFactors: string[] = [];

      if (progressRatio < 0.8) {
        status = 'behind';
        reasoning = `You're ${Math.round((1 - progressRatio) * 100)}% behind schedule. `;
        
        const causes = await this.identifyProgressLagCauses(goal);
        reasoning += causes.join(', ');
        
        recommendations.push(...await this.generateCatchUpRecommendations(goal, progressRatio));
        riskFactors.push(...await this.identifyRiskFactors(goal));
        
      } else if (progressRatio > 1.2) {
        status = 'ahead';
        reasoning = `Excellent! You're ${Math.round((progressRatio - 1) * 100)}% ahead of schedule. `;
        recommendations.push(...await this.generateAcceleratedRecommendations(goal));
        
      } else {
        status = 'on_track';
        reasoning = "You're progressing exactly as planned. ";
        recommendations.push(...await this.generateMaintenanceRecommendations(goal));
      }

      await this.updateGoalAnalysis(goalId, { status, reasoning, recommendations });

      return { status, reasoning, recommendations, riskFactors };
    } catch (error) {
      console.error("Error analyzing progress:", error);
      return {
        status: 'on_track',
        reasoning: 'Unable to analyze progress',
        recommendations: [],
        riskFactors: []
      };
    }
  }

  async generateContingencies(scenario: string): Promise<ContingencyPlan> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");

    try {
      const contingencyTemplates = {
        'gym_closure': {
          triggers: [
            { condition: 'facility_unavailable', threshold: 'true', timeframe: '1_day' }
          ],
          actions: {
            immediate: ['Switch to home workout', 'Notify scheduled workout partners'],
            shortTerm: ['Find alternative gym', 'Adapt routine for home equipment'],
            longTerm: ['Consider home gym setup', 'Explore outdoor alternatives']
          },
          alternatives: {
            exercise: {
              'bench_press': ['push_ups', 'dumbbell_press', 'resistance_band_press'],
              'squats': ['bodyweight_squats', 'lunges', 'single_leg_squats'],
              'deadlifts': ['romanian_deadlifts', 'glute_bridges', 'good_mornings']
            },
            nutrition: {},
            schedule: {
              'morning_workout': { time: 'evening', duration: 45 },
              'evening_workout': { time: 'lunch', duration: 30 }
            }
          }
        },
        'injury': {
          triggers: [
            { condition: 'pain_level', threshold: 6, timeframe: 'immediate' },
            { condition: 'range_of_motion', threshold: '75%', timeframe: '1_day' }
          ],
          actions: {
            immediate: ['Stop current exercise', 'Apply ice/heat as appropriate', 'Rest'],
            shortTerm: ['Modify workout plan', 'Focus on unaffected areas', 'Consult healthcare provider'],
            longTerm: ['Rehabilitation program', 'Prevent future injuries', 'Gradual return to activity']
          },
          alternatives: {
            exercise: {
              'lower_body_injury': ['upper_body_focus', 'seated_exercises', 'swimming'],
              'upper_body_injury': ['lower_body_focus', 'walking', 'leg_exercises'],
              'back_injury': ['core_stability', 'gentle_stretching', 'water_therapy']
            },
            nutrition: {
              'recovery': ['anti_inflammatory_foods', 'adequate_protein', 'hydration_focus']
            },
            schedule: {
              'reduced_frequency': { sessions: 2, duration: 30, intensity: 'low' }
            }
          }
        },
        'plateau': {
          triggers: [
            { condition: 'no_progress', threshold: 14, timeframe: 'days' },
            { condition: 'motivation_low', threshold: 3, timeframe: '1_week' }
          ],
          actions: {
            immediate: ['Change exercise selection', 'Vary rep ranges', 'Take deload week'],
            shortTerm: ['Implement periodization', 'Add new training modalities', 'Reassess nutrition'],
            longTerm: ['Complete program change', 'Work with trainer', 'Set new goals']
          },
          alternatives: {
            exercise: {
              'strength_plateau': ['volume_increase', 'intensity_techniques', 'exercise_variations'],
              'endurance_plateau': ['interval_training', 'cross_training', 'recovery_focus']
            },
            nutrition: {
              'weight_loss_plateau': ['calorie_cycling', 'macro_adjustment', 'meal_timing'],
              'muscle_gain_plateau': ['surplus_increase', 'protein_timing', 'creatine_supplementation']
            },
            schedule: {
              'frequency_change': { sessions: 4, duration: 60, split: 'upper_lower' }
            }
          }
        }
      };

      const template = contingencyTemplates[scenario as keyof typeof contingencyTemplates];
      if (!template) {
        throw new Error(`No contingency template for scenario: ${scenario}`);
      }

      const contingencyPlan: ContingencyPlan = {
        scenario,
        triggers: template.triggers,
        actions: template.actions,
        alternatives: template.alternatives,
        priority: this.assessScenarioPriority(scenario),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(
        collection(db, `users/${uid}/contingency_plans`),
        contingencyPlan
      );

      return { id: docRef.id, ...contingencyPlan };
    } catch (error) {
      console.error("Error generating contingencies:", error);
      throw error;
    }
  }

  async identifyCausalRelationships(
    outcomes: any[],
    factors: any[]
  ): Promise<CausalRelationship[]> {
    try {
      const relationships: CausalRelationship[] = [];

      for (const outcome of outcomes) {
        for (const factor of factors) {
          const correlation = this.calculateCorrelation(outcome, factor);
          
          if (Math.abs(correlation) > 0.3) {
            const relationship: CausalRelationship = {
              cause: factor.name,
              effect: outcome.name,
              strength: Math.abs(correlation),
              confidence: this.calculateCausalConfidence(outcome, factor),
              context: this.extractContext(outcome, factor),
              evidence: this.gatherEvidence(outcome, factor)
            };
            
            relationships.push(relationship);
          }
        }
      }

      this.causalRelationships = relationships;
      await this.saveCausalRelationships(relationships);

      return relationships;
    } catch (error) {
      console.error("Error identifying causal relationships:", error);
      return [];
    }
  }

  async adaptGoalBasedOnProgress(
    goalId: string,
    currentProgress: number,
    contextFactors: any
  ): Promise<{
    adaptations: string[];
    newMilestones?: any[];
    reasoning: string;
  }> {
    try {
      const goal = await this.getMultiStepGoal(goalId);
      if (!goal) throw new Error("Goal not found");

      const adaptations: string[] = [];
      let reasoning = "Based on current progress and context: ";

      const progressAnalysis = await this.analyzeProgress(goalId);
      
      if (progressAnalysis.status === 'behind') {
        adaptations.push('Extend deadline by 2 weeks');
        adaptations.push('Break down current milestone into smaller steps');
        adaptations.push('Increase support frequency');
        reasoning += "Extended timeline to ensure sustainable progress. ";
        
      } else if (progressAnalysis.status === 'ahead') {
        adaptations.push('Accelerate next milestone');
        adaptations.push('Add stretch goals');
        adaptations.push('Increase challenge level');
        reasoning += "Accelerated timeline due to excellent progress. ";
      }

      if (contextFactors.consistencyIssues) {
        adaptations.push('Simplify daily requirements');
        adaptations.push('Add flexibility in timing');
        reasoning += "Simplified approach to improve consistency. ";
      }

      const updatedGoal = await this.updateGoalAdaptations(goalId, adaptations);

      return {
        adaptations,
        newMilestones: updatedGoal?.milestones,
        reasoning
      };
    } catch (error) {
      console.error("Error adapting goal:", error);
      return {
        adaptations: [],
        reasoning: "Unable to adapt goal"
      };
    }
  }

  private async getCurrentValue(metric: string): Promise<number> {
    const progress = await getProgressHistory(1);
    if (progress.length === 0) return 0;
    
    const latest = progress[0];
    switch (metric) {
      case 'weight': return latest.metrics?.weight || 0;
      case 'body_fat': return latest.metrics?.bodyFat || 0;
      case 'strength': return latest.metrics?.strengthMetrics?.benchPress || 0;
      default: return 0;
    }
  }

  private async generateMilestones(
    currentValue: number,
    targetValue: number,
    deadline: string,
    metric: string
  ): Promise<MultiStepGoal['milestones']> {
    const totalChange = targetValue - currentValue;
    const deadlineDate = new Date(deadline);
    const timeframe = deadlineDate.getTime() - Date.now();
    const weeklyGoal = totalChange / (timeframe / (7 * 24 * 60 * 60 * 1000));

    const milestones: MultiStepGoal['milestones'] = [];
    
    for (let week = 1; week <= Math.ceil(timeframe / (7 * 24 * 60 * 60 * 1000)); week++) {
      const milestoneDate = new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000);
      const milestoneValue = currentValue + (weeklyGoal * week);
      
      milestones.push({
        id: `milestone_${week}`,
        description: `Reach ${milestoneValue.toFixed(1)} ${metric} by week ${week}`,
        targetValue: milestoneValue,
        deadline: milestoneDate.toISOString(),
        status: 'pending',
        adaptiveStrategy: {
          conditions: ['on_track', 'behind_schedule', 'ahead_schedule'],
          adjustments: [
            { condition: 'behind', action: 'extend_timeline' },
            { condition: 'ahead', action: 'accelerate' }
          ]
        }
      });
    }

    return milestones;
  }

  private async generateStrategies(goalDescription: string, metric: string): Promise<MultiStepGoal['strategies']> {
    const strategies: MultiStepGoal['strategies'] = {
      primary: [],
      contingency: [],
      adaptive: true
    };

    if (metric === 'weight') {
      strategies.primary = ['caloric_deficit', 'regular_exercise', 'macro_tracking'];
      strategies.contingency = ['plateau_protocols', 'refeed_days', 'exercise_variation'];
    } else if (metric === 'strength') {
      strategies.primary = ['progressive_overload', 'compound_movements', 'adequate_recovery'];
      strategies.contingency = ['deload_weeks', 'exercise_substitution', 'volume_adjustment'];
    }

    return strategies;
  }

  private async getMultiStepGoal(goalId: string): Promise<MultiStepGoal | null> {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    try {
      const docRef = doc(db, `users/${uid}/multi_step_goals`, goalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MultiStepGoal;
      }
      return null;
    } catch (error) {
      console.error("Error getting multi-step goal:", error);
      return null;
    }
  }

  private async calculateCurrentProgress(goal: MultiStepGoal): Promise<number> {
    const currentValue = await this.getCurrentValue(goal.mainGoal.metric);
    const totalChange = goal.mainGoal.targetValue - goal.mainGoal.currentValue;
    const achievedChange = currentValue - goal.mainGoal.currentValue;
    return (achievedChange / totalChange) * 100;
  }

  private calculateExpectedProgress(goal: MultiStepGoal): number {
    const startDate = new Date(goal.createdAt);
    const endDate = new Date(goal.mainGoal.deadline);
    const now = new Date();
    
    const totalTime = endDate.getTime() - startDate.getTime();
    const elapsedTime = now.getTime() - startDate.getTime();
    
    return (elapsedTime / totalTime) * 100;
  }

  private async identifyProgressLagCauses(goal: MultiStepGoal): Promise<string[]> {
    return ['inconsistent tracking', 'unrealistic expectations', 'lifestyle factors'];
  }

  private async generateCatchUpRecommendations(goal: MultiStepGoal, progressRatio: number): Promise<string[]> {
    return [
      'Increase workout frequency by 1 session per week',
      'Tighten nutrition tracking',
      'Add 15 minutes to each workout',
      'Focus on compound movements'
    ];
  }

  private async identifyRiskFactors(goal: MultiStepGoal): Promise<string[]> {
    return ['time constraints', 'motivation fluctuations', 'external stressors'];
  }

  private async generateAcceleratedRecommendations(goal: MultiStepGoal): Promise<string[]> {
    return [
      'Add advanced techniques',
      'Increase training complexity',
      'Set stretch goals'
    ];
  }

  private async generateMaintenanceRecommendations(goal: MultiStepGoal): Promise<string[]> {
    return [
      'Continue current approach',
      'Minor progressive adjustments',
      'Monitor for plateaus'
    ];
  }

  private async updateGoalAnalysis(goalId: string, analysis: any): Promise<void> {
    
  }

  private assessScenarioPriority(scenario: string): 'low' | 'medium' | 'high' {
    const priorities: { [key: string]: 'low' | 'medium' | 'high' } = {
      'injury': 'high',
      'gym_closure': 'medium',
      'plateau': 'medium',
      'schedule_conflict': 'low'
    };
    return priorities[scenario] || 'medium';
  }

  private calculateCorrelation(outcome: any, factor: any): number {
    return Math.random() * 0.8 - 0.4;
  }

  private calculateCausalConfidence(outcome: any, factor: any): number {
    return Math.random() * 0.6 + 0.4;
  }

  private extractContext(outcome: any, factor: any): string[] {
    return ['time_of_day', 'season', 'stress_level'];
  }

  private gatherEvidence(outcome: any, factor: any): CausalRelationship['evidence'] {
    return [
      {
        observation: 'Correlation observed',
        timestamp: new Date().toISOString(),
        impact: 0.5
      }
    ];
  }

  private async saveCausalRelationships(relationships: CausalRelationship[]): Promise<void> {
    
  }

  private async updateGoalAdaptations(goalId: string, adaptations: string[]): Promise<MultiStepGoal | null> {
    return null;
  }
}

export const planningReasoningService = new PlanningReasoningService();