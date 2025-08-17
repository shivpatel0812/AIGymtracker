import { 
  saveConversationEntry, 
  getUserPreferences,
  saveUserPreferences,
  updateAgentMemory,
  analyzeUserPatterns 
} from './agentMemory';
import { 
  getComprehensiveProfile,
  generatePersonalizedRecommendations 
} from './comprehensiveProfile';
import { 
  generateProactiveSuggestions, 
  getFitnessGoals,
  adaptWorkoutPlan 
} from './goalOriented';
import { toolUsageService } from './toolUsage';
import { 
  learningAdaptationService,
  OutcomeTracking,
  FeedbackLoop 
} from './learningAdaptation';
import { autonomousActionsService } from './autonomousActions';
import { planningReasoningService } from './planningReasoning';

export interface AgentContext {
  userId: string;
  currentScreen?: string;
  recentActions: string[];
  sessionData: any;
  environmentFactors: {
    timeOfDay: string;
    weather?: any;
    location?: string;
  };
}

export interface AgentResponse {
  type: 'advice' | 'suggestion' | 'intervention' | 'celebration' | 'question';
  message: string;
  actions?: Array<{
    type: string;
    label: string;
    payload: any;
  }>;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
  context: any;
}

export interface AgentCapabilities {
  proactiveMonitoring: boolean;
  adaptivePlanning: boolean;
  contextualAdvice: boolean;
  autonomousActions: boolean;
  learningEnabled: boolean;
  goalTracking: boolean;
}

class AgentOrchestrator {
  private capabilities: AgentCapabilities = {
    proactiveMonitoring: true,
    adaptivePlanning: true,
    contextualAdvice: true,
    autonomousActions: true,
    learningEnabled: true,
    goalTracking: true
  };

  private context: AgentContext = {
    userId: '',
    recentActions: [],
    sessionData: {},
    environmentFactors: {
      timeOfDay: new Date().toLocaleTimeString()
    }
  };

  async initialize(userId: string, initialContext?: Partial<AgentContext>): Promise<void> {
    this.context = {
      userId,
      recentActions: [],
      sessionData: {},
      environmentFactors: {
        timeOfDay: new Date().toLocaleTimeString()
      },
      ...initialContext
    };

    await this.loadUserContext();
    await this.runInitialAnalysis();
  }

  async processUserInteraction(
    userMessage: string,
    actionContext?: any
  ): Promise<AgentResponse> {
    try {
      await this.updateContext(userMessage, actionContext);
      
      const response = await this.generateContextualResponse(userMessage, actionContext);
      
      await this.saveInteraction(userMessage, response);
      
      if (this.capabilities.learningEnabled) {
        await this.updateLearningModels(userMessage, response, actionContext);
      }

      if (this.capabilities.autonomousActions) {
        this.scheduleAutonomousCheck();
      }

      return response;
    } catch (error) {
      console.error('Error processing user interaction:', error);
      return this.getErrorResponse();
    }
  }

  async runProactiveMonitoring(): Promise<AgentResponse[]> {
    if (!this.capabilities.proactiveMonitoring) return [];

    try {
      const responses: AgentResponse[] = [];

      const suggestions = await generateProactiveSuggestions();
      for (const suggestion of suggestions) {
        responses.push(this.convertSuggestionToResponse(suggestion));
      }

      const autonomousActions = await autonomousActionsService.checkAndExecuteAutonomousActions();
      for (const action of autonomousActions) {
        if (action.status === 'user_approval_required') {
          responses.push(this.convertActionToResponse(action));
        }
      }

      const plateauCheck = await autonomousActionsService.detectPlateaus();
      if (plateauCheck.detected) {
        responses.push({
          type: 'intervention',
          message: `I've detected a plateau in your ${plateauCheck.metrics.join(', ')} progress. Here's what we can do to break through:`,
          actions: plateauCheck.recommendations.map(rec => ({
            type: 'implement_recommendation',
            label: rec,
            payload: { recommendation: rec }
          })),
          priority: 'high',
          reasoning: 'Performance plateau detected requiring intervention',
          context: { plateauMetrics: plateauCheck.metrics }
        });
      }

      return responses.filter(r => r.priority === 'high' || r.priority === 'medium');
    } catch (error) {
      console.error('Error in proactive monitoring:', error);
      return [];
    }
  }

  async adaptToUserBehavior(behaviorData: {
    consistency: number;
    preferences: any;
    performance: any;
    feedback: any;
  }): Promise<{
    adaptations: string[];
    newApproach: any;
    reasoning: string;
  }> {
    try {
      const patterns = await analyzeUserPatterns();
      const preferences = await getUserPreferences();

      const adaptations: string[] = [];
      let reasoning = '';

      if (behaviorData.consistency < 70) {
        adaptations.push('Simplify workout recommendations');
        adaptations.push('Reduce session frequency temporarily');
        adaptations.push('Focus on habit formation');
        reasoning += 'Low consistency detected, focusing on sustainable habits. ';
      }

      if (behaviorData.feedback.satisfaction < 3) {
        adaptations.push('Increase exercise variety');
        adaptations.push('Adjust communication style');
        adaptations.push('Provide more motivational content');
        reasoning += 'User satisfaction low, enhancing engagement strategies. ';
      }

      if (patterns.responseToAdvice === 'ignores') {
        adaptations.push('Reduce advice frequency');
        adaptations.push('Focus on user-initiated interactions');
        adaptations.push('Provide data-driven insights only');
        reasoning += 'User prefers minimal guidance, adapting to hands-off approach. ';
      }

      const newApproach = await this.generateNewApproach(adaptations, behaviorData);

      await updateAgentMemory({
        userId: this.context.userId,
        patterns,
        lastUpdated: new Date().toISOString()
      });

      return { adaptations, newApproach, reasoning };
    } catch (error) {
      console.error('Error adapting to user behavior:', error);
      return {
        adaptations: [],
        newApproach: {},
        reasoning: 'Unable to adapt behavior'
      };
    }
  }

  async generateWorkoutSuggestion(context: {
    previousWorkouts: any[];
    availableTime: number;
    equipment: string[];
    goals: string[];
  }): Promise<AgentResponse> {
    try {
      const [preferences, comprehensiveProfile, personalizedRecs] = await Promise.all([
        getUserPreferences(),
        getComprehensiveProfile(),
        generatePersonalizedRecommendations()
      ]);
      
      const weather = await toolUsageService.getWeatherForWorkout();
      const userGoal = preferences?.fitnessGoals?.description || null;
      
      let suggestion = '';
      const actions: AgentResponse['actions'] = [];

      // Enhanced suggestions using comprehensive profile
      if (comprehensiveProfile?.brainDumpSections.workoutExperiences) {
        const workoutExp = comprehensiveProfile.brainDumpSections.workoutExperiences.toLowerCase();
        
        // Check for specific exercise preferences from brain dump
        if (workoutExp.includes('dip') && workoutExp.includes('tricep')) {
          suggestion += `🎯 **Based on your experience**: Including dips in today's workout since you mentioned they work exceptionally well for your triceps.\n\n`;
        }
        
        if (workoutExp.includes('morning') && workoutExp.includes('energy')) {
          const currentHour = new Date().getHours();
          if (currentHour < 10) {
            suggestion += `⚡ **Perfect timing**: You mentioned morning workouts give you more energy - great choice!\n\n`;
          }
        }
        
        if (workoutExp.includes('volume') && workoutExp.includes('legs')) {
          if (context.goals.includes('legs') || userGoal?.includes('leg')) {
            suggestion += `🦵 **Volume Strategy**: Using higher volume for legs based on your positive response to leg volume training.\n\n`;
          }
        }
      }

      // Goal-specific workout suggestions
      if (userGoal && userGoal.includes('lean') && userGoal.includes('muscle')) {
        if (context.availableTime < 30) {
          suggestion = `Perfect for your lean + strong goal! Here's a 20-minute metabolic strength circuit:\n\n🔥 **Lean Muscle HIIT Circuit:**\n• Compound movements (squats, push-ups, rows)\n• 45 seconds work, 15 seconds rest\n• 4 rounds, 3 exercises per round\n• Burns fat while preserving muscle`;
        } else {
          suggestion = `Excellent! Here's a workout designed for your lean + strong goal:\n\n💪 **Lean Muscle Workout (${context.availableTime} min):**\n• Compound strength training (70% of time)\n• Metabolic finisher (20% of time)\n• Core/stability work (10% of time)\n\nThis approach maximizes muscle retention while promoting fat loss!`;
        }
        
        actions.push({
          type: 'start_lean_workout',
          label: 'Start Lean Workout',
          payload: { goal: 'lean_muscle', duration: context.availableTime }
        });
        actions.push({
          type: 'explain_workout',
          label: 'Why This Works',
          payload: { explanation: 'lean_muscle_science' }
        });
      } else if (context.availableTime < 30) {
        suggestion = "I see you have limited time today. Let's focus on a high-intensity 20-minute session targeting your primary muscle groups.";
        actions.push({
          type: 'start_quick_workout',
          label: 'Start 20-min HIIT',
          payload: { duration: 20, type: 'hiit' }
        });
      } else if (!weather.suitableForOutdoor && context.equipment.includes('outdoor')) {
        const alternatives = await toolUsageService.generateWorkoutAlternatives(
          'outdoor running', 
          'weather'
        );
        suggestion = `Weather isn't great for outdoor workouts. How about trying ${alternatives[0]} instead?`;
        actions.push({
          type: 'start_indoor_alternative',
          label: `Start ${alternatives[0]}`,
          payload: { exercise: alternatives[0] }
        });
      } else {
        suggestion = await this.generatePersonalizedSuggestion(context, preferences, comprehensiveProfile);
        actions.push({
          type: 'start_suggested_workout',
          label: 'Start Workout',
          payload: { workoutPlan: suggestion }
        });
      }

      // Add personalized recommendations from the service
      if (personalizedRecs.workoutRecommendations.length > 0) {
        suggestion += `\n\n🎯 **Personalized Tips:**\n• ${personalizedRecs.workoutRecommendations.slice(0, 2).join('\n• ')}`;
      }

      return {
        type: 'suggestion',
        message: suggestion,
        actions,
        priority: 'medium',
        reasoning: comprehensiveProfile ? 
          `Highly personalized based on comprehensive profile and brain dump insights` : 
          (userGoal ? `Generated specifically for user goal: ${userGoal}` : 'Generated based on available time, equipment, and weather conditions'),
        context: { weather, availableTime: context.availableTime, userGoal, hasComprehensiveProfile: !!comprehensiveProfile }
      };
    } catch (error) {
      console.error('Error generating workout suggestion:', error);
      return this.getErrorResponse();
    }
  }

  async celebrateAchievement(achievement: {
    type: 'goal_reached' | 'streak' | 'personal_best' | 'consistency';
    value: any;
    context: any;
  }): Promise<AgentResponse> {
    const celebrations = {
      goal_reached: `🎉 Incredible! You've reached your goal of ${achievement.value}! This is a testament to your dedication and hard work.`,
      streak: `🔥 Amazing ${achievement.value}-day streak! Your consistency is paying off in a big way.`,
      personal_best: `💪 New personal best! You just ${achievement.value} - that's serious progress!`,
      consistency: `⭐ Your consistency this ${achievement.context.period} has been outstanding! You've maintained ${achievement.value}% adherence.`
    };

    const nextSteps = await this.generateNextStepsAfterAchievement(achievement);

    return {
      type: 'celebration',
      message: celebrations[achievement.type],
      actions: nextSteps.map(step => ({
        type: 'next_step',
        label: step.label,
        payload: step.payload
      })),
      priority: 'high',
      reasoning: 'Celebrating achievement to reinforce positive behavior',
      context: achievement
    };
  }

  async handleEmergencyScenario(scenario: {
    type: 'injury' | 'equipment_failure' | 'time_constraint' | 'motivation_crisis';
    severity: 'low' | 'medium' | 'high';
    context: any;
  }): Promise<AgentResponse> {
    try {
      const contingencyPlan = await planningReasoningService.generateContingencies(scenario.type);
      
      let immediateActions: string[];
      let message: string;

      switch (scenario.type) {
        case 'injury':
          immediateActions = contingencyPlan.actions.immediate;
          message = 'I noticed you mentioned discomfort. Let\'s prioritize your safety and modify your approach.';
          break;
        case 'motivation_crisis':
          immediateActions = ['Take a step back', 'Remember your why', 'Start with 5 minutes'];
          message = 'Feeling unmotivated happens to everyone. Let\'s find a way to reconnect with your fitness journey.';
          break;
        default:
          immediateActions = contingencyPlan.actions.immediate;
          message = 'I\'ve detected an issue. Here\'s how we can address it:';
      }

      return {
        type: 'intervention',
        message,
        actions: immediateActions.map(action => ({
          type: 'emergency_action',
          label: action,
          payload: { action, scenario: scenario.type }
        })),
        priority: 'high',
        reasoning: `Emergency response for ${scenario.type} with ${scenario.severity} severity`,
        context: { contingencyPlan, scenario }
      };
    } catch (error) {
      console.error('Error handling emergency scenario:', error);
      return {
        type: 'intervention',
        message: 'I notice you might need support. Take things one step at a time.',
        priority: 'high',
        reasoning: 'Fallback emergency response',
        context: scenario
      };
    }
  }

  private async loadUserContext(): Promise<void> {
    try {
      const preferences = await getUserPreferences();
      const patterns = await analyzeUserPatterns();
      
      this.context.sessionData = {
        preferences,
        patterns,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  }

  private async runInitialAnalysis(): Promise<void> {
    try {
      if (this.capabilities.proactiveMonitoring) {
        setTimeout(() => this.runProactiveMonitoring(), 5000);
      }

      if (this.capabilities.autonomousActions) {
        setTimeout(() => autonomousActionsService.checkAndExecuteAutonomousActions(), 10000);
      }
    } catch (error) {
      console.error('Error in initial analysis:', error);
    }
  }

  private async updateContext(userMessage: string, actionContext?: any): Promise<void> {
    this.context.recentActions.push(userMessage);
    if (this.context.recentActions.length > 10) {
      this.context.recentActions = this.context.recentActions.slice(-10);
    }

    this.context.environmentFactors.timeOfDay = new Date().toLocaleTimeString();
    
    if (actionContext?.screen) {
      this.context.currentScreen = actionContext.screen;
    }
  }

  private async generateContextualResponse(
    userMessage: string, 
    actionContext?: any
  ): Promise<AgentResponse> {
    const [goals, preferences, comprehensiveProfile] = await Promise.all([
      getFitnessGoals(),
      getUserPreferences(),
      getComprehensiveProfile()
    ]);
    const message = userMessage.toLowerCase();
    
    // Get recent conversation context for more intelligent responses
    const recentMessages = this.context.recentActions.slice(-3).join(' ').toLowerCase();
    
    // Enhanced goal detection and persistent memory
    if (this.isGoalSettingMessage(message)) {
      return await this.handleGoalSetting(userMessage, actionContext);
    }
    
    // Check if user is continuing a conversation thread
    if (this.isContinuationMessage(message, recentMessages)) {
      return await this.handleConversationContinuation(userMessage, recentMessages, actionContext);
    }
    
    // Greeting responses
    if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
      // Check if this is a returning conversation
      const isReturning = this.context.recentActions.length > 0;
      const greetingMessage = isReturning 
        ? `Welcome back! I see you're ${this.context.currentScreen ? `on the ${this.context.currentScreen} screen` : 'here'}. Ready to continue crushing your fitness goals?`
        : `Hello! I'm your AI fitness coach. I see you're ${this.context.currentScreen ? `on the ${this.context.currentScreen} screen` : 'here'}. How can I help you achieve your fitness goals today?`;
      
      return {
        type: 'advice',
        message: greetingMessage,
        actions: [
          { type: 'workout_suggestion', label: 'Suggest Workout', payload: {} },
          { type: 'set_goals', label: 'Set Goals', payload: {} }
        ],
        priority: 'medium',
        reasoning: 'Contextual greeting response based on conversation history',
        context: { userMessage, actionContext }
      };
    }

    // How are you responses
    if (message.includes('how are you') || message.includes('how do you feel')) {
      const responses = [
        `I'm doing great, thanks for asking! I'm here and ready to help you crush your fitness goals. Speaking of which, how has your training been going lately?`,
        `Fantastic, thank you! I'm energized and ready to help you reach new fitness heights. What's on your workout agenda today?`,
        `I'm excellent, thanks! Always excited to help someone achieve their fitness goals. What can we work on together?`
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        type: 'advice',
        message: randomResponse,
        actions: [
          { type: 'progress_check', label: 'Check Progress', payload: {} },
          { type: 'motivation_boost', label: 'Need Motivation?', payload: {} }
        ],
        priority: 'medium',
        reasoning: 'Personal response that redirects to fitness with variation',
        context: { userMessage, actionContext }
      };
    }

    // Exercise-specific advice
    if (message.includes('bench') || message.includes('bench press')) {
      let benchAdvice = `Great question about bench press! Here are my top tips:\n\n• **Setup**: Retract shoulder blades, tight core, feet planted\n• **Grip**: Slightly wider than shoulders, knuckles up\n• **Path**: Touch chest at nipple line, press up and slightly back\n• **Progression**: Add 2.5-5lbs weekly, focus on form first\n\nWhat's your current bench press weight? I can help create a progression plan!`;
      
      // Add personalized insights from comprehensive profile
      if (comprehensiveProfile?.brainDumpSections.workoutExperiences) {
        const workoutExp = comprehensiveProfile.brainDumpSections.workoutExperiences.toLowerCase();
        if (workoutExp.includes('bench') && workoutExp.includes('plateau')) {
          benchAdvice += `\n\n🎯 **Personal Note**: I see you've mentioned bench plateau challenges in your profile. Let's focus on technique refinement and accessory work to break through!`;
        }
        if (workoutExp.includes('chest') || workoutExp.includes('tricep')) {
          benchAdvice += `\n\n💡 **Based on your notes**: Incorporating your insights about chest/tricep development into the programming.`;
        }
      }

      return {
        type: 'advice',
        message: benchAdvice,
        actions: [
          { type: 'create_program', label: 'Create Bench Program', payload: { exercise: 'bench_press' } },
          { type: 'form_check', label: 'Form Tips', payload: { exercise: 'bench_press' } }
        ],
        priority: 'high',
        reasoning: comprehensiveProfile ? 'Personalized bench press advice based on user profile and history' : 'Specific exercise advice with actionable tips',
        context: { userMessage, actionContext, hasPersonalHistory: !!comprehensiveProfile }
      };
    }

    if (message.includes('squat')) {
      return {
        type: 'advice',
        message: `Excellent! Squats are the king of exercises. Here's how to nail them:\n\n• **Stance**: Feet shoulder-width apart, toes slightly out\n• **Depth**: Hip crease below knee cap\n• **Knees**: Track over toes, don't cave inward\n• **Core**: Brace like someone's about to punch you\n• **Drive**: Push through heels, squeeze glutes at top\n\nAre you doing back squats, front squats, or bodyweight?`,
        actions: [
          { type: 'squat_form', label: 'Squat Form Check', payload: { exercise: 'squat' } },
          { type: 'squat_program', label: 'Squat Program', payload: { exercise: 'squat' } }
        ],
        priority: 'high',
        reasoning: 'Squat-specific form and technique advice',
        context: { userMessage, actionContext }
      };
    }

    if (message.includes('deadlift')) {
      return {
        type: 'advice',
        message: `Deadlifts! The ultimate strength builder. Here's the breakdown:\n\n• **Setup**: Bar over mid-foot, shins close to bar\n• **Grip**: Just outside legs, mixed or double overhand\n• **Back**: Neutral spine, chest up, lats engaged\n• **Drive**: Push floor away with feet, hips forward\n• **Lockout**: Stand tall, don't hyperextend\n\nConventional or sumo deadlift? I can help with both!`,
        actions: [
          { type: 'deadlift_form', label: 'Deadlift Form', payload: { exercise: 'deadlift' } },
          { type: 'deadlift_program', label: 'DL Program', payload: { exercise: 'deadlift' } }
        ],
        priority: 'high',
        reasoning: 'Deadlift-specific technique and safety advice',
        context: { userMessage, actionContext }
      };
    }

    // Workout requests
    if (message.includes('workout') || message.includes('exercise') || message.includes('training')) {
      return await this.generateWorkoutSuggestion({
        previousWorkouts: [],
        availableTime: actionContext?.availableTime || 60,
        equipment: actionContext?.equipment || ['bodyweight', 'dumbbells'],
        goals: goals.map(g => g.type)
      });
    }

    // Help/stuck responses
    if (message.includes('help') || message.includes('stuck') || message.includes('confused')) {
      return await this.handleEmergencyScenario({
        type: 'motivation_crisis',
        severity: 'medium',
        context: { userMessage, actionContext }
      });
    }

    // Nutrition questions
    if (message.includes('eat') || message.includes('food') || message.includes('nutrition') || message.includes('diet')) {
      return {
        type: 'advice',
        message: `Nutrition is crucial for your fitness goals! Here's what I recommend:\n\n• **Protein**: 0.8-1g per lb bodyweight daily\n• **Timing**: Eat protein within 2 hours post-workout\n• **Hydration**: Half your bodyweight in ounces of water\n• **Whole foods**: Focus on minimally processed options\n\nWhat specific nutrition goals do you have?`,
        actions: [
          { type: 'nutrition_plan', label: 'Create Meal Plan', payload: {} },
          { type: 'macro_calculator', label: 'Calculate Macros', payload: {} }
        ],
        priority: 'medium',
        reasoning: 'Nutrition guidance with specific recommendations',
        context: { userMessage, actionContext }
      };
    }

    // Progress/motivation questions
    if (message.includes('progress') || message.includes('plateau') || message.includes('improve')) {
      return {
        type: 'advice',
        message: `Let's assess your progress! Plateaus are normal and can be overcome with the right strategy:\n\n• **Vary intensity**: Try different rep ranges\n• **Progressive overload**: Gradually increase weight/reps\n• **Recovery**: Ensure adequate sleep and rest days\n• **Nutrition**: Fuel your training properly\n\nWhat specific area would you like to improve?`,
        actions: [
          { type: 'progress_analysis', label: 'Analyze Progress', payload: {} },
          { type: 'plateau_breaker', label: 'Break Plateau', payload: {} }
        ],
        priority: 'high',
        reasoning: 'Progress-focused advice with specific strategies',
        context: { userMessage, actionContext }
      };
    }

    // Goal setting
    if (message.includes('goal') || message.includes('target') || message.includes('want to')) {
      return {
        type: 'advice',
        message: `Setting clear goals is the first step to success! I can help you create SMART fitness goals:\n\n• **Specific**: Clear, defined objectives\n• **Measurable**: Track progress with numbers\n• **Achievable**: Realistic for your level\n• **Relevant**: Aligned with your lifestyle\n• **Time-bound**: Clear deadlines\n\nWhat fitness goal would you like to set?`,
        actions: [
          { type: 'goal_wizard', label: 'Goal Setting Wizard', payload: {} },
          { type: 'progress_tracker', label: 'Set Up Tracking', payload: {} }
        ],
        priority: 'high',
        reasoning: 'Goal-setting guidance with framework',
        context: { userMessage, actionContext }
      };
    }

    // Default response with more context awareness
    const timeOfDay = new Date().getHours();
    let timeGreeting = '';
    if (timeOfDay < 12) timeGreeting = 'Good morning!';
    else if (timeOfDay < 17) timeGreeting = 'Good afternoon!';
    else timeGreeting = 'Good evening!';

    return {
      type: 'advice',
      message: `${timeGreeting} I'm your AI fitness coach and I'm here to help! I can assist with workouts, nutrition, form tips, goal setting, and motivation. What would you like to work on?`,
      actions: [
        { type: 'workout_suggestion', label: 'Get Workout', payload: {} },
        { type: 'nutrition_advice', label: 'Nutrition Help', payload: {} },
        { type: 'set_goals', label: 'Set Goals', payload: {} },
        { type: 'motivation', label: 'Need Motivation', payload: {} }
      ],
      priority: 'medium',
      reasoning: 'Contextual default response with helpful options',
      context: { userMessage, actionContext }
    };
  }

  private async saveInteraction(userMessage: string, response: AgentResponse): Promise<void> {
    try {
      await saveConversationEntry({
        timestamp: new Date().toISOString(),
        userMessage,
        aiResponse: response.message,
        context: {
          screenContext: this.context.currentScreen || 'unknown',
          dataContext: response.context || {},
          actionTaken: response.actions?.[0]?.type
        }
      });
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  }

  private async updateLearningModels(
    userMessage: string, 
    response: AgentResponse, 
    actionContext?: any
  ): Promise<void> {
    try {
      await learningAdaptationService.recognizePatterns();
    } catch (error) {
      console.error('Error updating learning models:', error);
    }
  }

  private scheduleAutonomousCheck(): void {
    setTimeout(async () => {
      try {
        await autonomousActionsService.checkAndExecuteAutonomousActions();
      } catch (error) {
        console.error('Error in scheduled autonomous check:', error);
      }
    }, 30000);
  }

  private convertSuggestionToResponse(suggestion: any): AgentResponse {
    return {
      type: 'suggestion',
      message: suggestion.message,
      actions: suggestion.actionButtons?.map((btn: any) => ({
        type: btn.action,
        label: btn.text,
        payload: { suggestionId: suggestion.id }
      })),
      priority: suggestion.priority as AgentResponse['priority'],
      reasoning: `Proactive suggestion based on ${suggestion.triggerCondition}`,
      context: { suggestion }
    };
  }

  private convertActionToResponse(action: any): AgentResponse {
    return {
      type: 'intervention',
      message: action.action.description,
      actions: [{
        type: 'approve_action',
        label: 'Approve',
        payload: { actionId: action.id }
      }, {
        type: 'deny_action',
        label: 'Not Now',
        payload: { actionId: action.id }
      }],
      priority: 'high',
      reasoning: 'Autonomous action requiring user approval',
      context: { action }
    };
  }

  private getErrorResponse(): AgentResponse {
    return {
      type: 'advice',
      message: 'I encountered an issue, but I\'m still here to help! Let\'s try something else.',
      priority: 'low',
      reasoning: 'Error fallback response',
      context: {}
    };
  }

  // Enhanced goal detection
  private isGoalSettingMessage(message: string): boolean {
    const goalKeywords = [
      'want to', 'goal', 'target', 'aim', 'trying to', 'working towards',
      'lose weight', 'gain muscle', 'get stronger', 'lean', 'cut', 'bulk',
      'shredded', 'toned', 'definition', 'mass', 'strength', 'endurance'
    ];
    return goalKeywords.some(keyword => message.includes(keyword));
  }

  // Detect conversation continuations
  private isContinuationMessage(message: string, recentMessages: string): boolean {
    const continuationWords = [
      'yes', 'yeah', 'ok', 'sure', 'can you', 'will you', 'also', 'and',
      'but', 'however', 'what about', 'how about', 'can i', 'should i'
    ];
    return continuationWords.some(word => message.includes(word)) && recentMessages.length > 0;
  }

  // Handle goal setting with persistent memory
  private async handleGoalSetting(userMessage: string, actionContext?: any): Promise<AgentResponse> {
    const message = userMessage.toLowerCase();
    
    // Parse the goal from the message
    let goalType = 'general';
    let goalDescription = userMessage;
    
    if (message.includes('lean') && (message.includes('strong') || message.includes('muscle'))) {
      goalType = 'lean_muscle';
      goalDescription = 'Become lean while maintaining/building muscle (body recomposition)';
    } else if (message.includes('lose weight') || message.includes('cut')) {
      goalType = 'lose_weight';
    } else if (message.includes('gain muscle') || message.includes('bulk')) {
      goalType = 'gain_muscle';
    } else if (message.includes('stronger') || message.includes('strength')) {
      goalType = 'strength';
    }

    // Save the goal to preferences
    try {
      const currentPrefs = await getUserPreferences() || {
        communicationStyle: 'motivational' as const,
        notificationPreferences: {
          workoutReminders: true,
          motivationalMessages: true,
          progressUpdates: true,
          frequency: 'weekly' as const
        },
        fitnessGoals: {
          primaryGoal: 'maintain' as const
        },
        preferredWorkoutTimes: [],
        dietaryRestrictions: [],
        injuryHistory: []
      };

      await saveUserPreferences({
        ...currentPrefs,
        fitnessGoals: {
          ...currentPrefs.fitnessGoals,
          primaryGoal: goalType as any,
          description: goalDescription,
          setAt: new Date().toISOString()
        }
      });

      return {
        type: 'celebration',
        message: `Perfect! I've saved your goal: "${goalDescription}"\n\n🎯 **Your Personalized Approach:**\n• Focus on compound movements for efficiency\n• Combine strength training with metabolic work\n• Prioritize protein intake (1g per lb bodyweight)\n• Moderate caloric deficit with adequate recovery\n\n**From now on, ALL my analysis and recommendations will be tailored to help you get lean while staying strong!** 💪\n\nReady to start? What would you like to work on first?`,
        actions: [
          { type: 'create_lean_program', label: 'Create Lean Program', payload: { goal: goalType } },
          { type: 'nutrition_plan', label: 'Nutrition Strategy', payload: { goal: goalType } },
          { type: 'progress_tracking', label: 'Track Progress', payload: { goal: goalType } }
        ],
        priority: 'high',
        reasoning: 'Goal successfully captured and personalized approach provided',
        context: { userMessage, goalType, goalDescription }
      };
    } catch (error) {
      return {
        type: 'advice',
        message: 'I understand your goal! While I had trouble saving it to your profile, I\'ll keep it in mind for our conversation. Let\'s work on getting you lean and strong!',
        priority: 'medium',
        reasoning: 'Goal acknowledged despite save error',
        context: { userMessage, actionContext }
      };
    }
  }

  // Handle conversation continuations
  private async handleConversationContinuation(
    userMessage: string, 
    recentMessages: string,
    actionContext?: any
  ): Promise<AgentResponse> {
    const message = userMessage.toLowerCase();
    
    // If recent messages mentioned goals/analysis, provide follow-up
    if (recentMessages.includes('goal') || recentMessages.includes('analysis')) {
      if (message.includes('yes') || message.includes('yeah') || message.includes('sure')) {
        return {
          type: 'advice',
          message: 'Awesome! I\'m excited to help you achieve that. What specific aspect would you like to focus on first - training program, nutrition strategy, or progress tracking?',
          actions: [
            { type: 'training_focus', label: 'Training Program', payload: {} },
            { type: 'nutrition_focus', label: 'Nutrition Plan', payload: {} },
            { type: 'tracking_focus', label: 'Progress Tracking', payload: {} }
          ],
          priority: 'high',
          reasoning: 'Following up on user agreement to goal setting',
          context: { userMessage, actionContext }
        };
      }
      
      if (message.includes('can you') || message.includes('will you')) {
        return {
          type: 'advice',
          message: 'Absolutely! I can definitely help with that. I\'ll make sure all my recommendations align with your lean + strong goal. What specifically would you like me to help you with?',
          actions: [
            { type: 'workout_analysis', label: 'Analyze Workouts', payload: {} },
            { type: 'nutrition_analysis', label: 'Analyze Nutrition', payload: {} },
            { type: 'progress_analysis', label: 'Analyze Progress', payload: {} }
          ],
          priority: 'high',
          reasoning: 'Confirming ability to help with goal-oriented analysis',
          context: { userMessage, actionContext }
        };
      }
    }

    // If this seems like a follow-up question, be more specific
    if (message.includes('like') || message.includes('such as') || message.includes('example')) {
      const preferences = await getUserPreferences();
      const userGoal = preferences?.fitnessGoals?.description || 'your fitness goals';
      
      return {
        type: 'advice',
        message: `Great question! Since your goal is ${userGoal}, here are specific examples of how I'll tailor everything:\n\n🎯 **Workout Analysis**: Focus on strength + metabolic efficiency\n📊 **Nutrition Analysis**: Emphasize protein timing and deficit sustainability\n📈 **Progress Tracking**: Monitor both strength gains AND body composition\n💡 **Recommendations**: Always balance muscle preservation with fat loss\n\nEvery piece of advice will be filtered through this lens!`,
        actions: [
          { type: 'example_workout', label: 'Example Workout', payload: {} },
          { type: 'example_nutrition', label: 'Example Meal Plan', payload: {} }
        ],
        priority: 'high',
        reasoning: 'Providing specific examples based on user goal',
        context: { userMessage, actionContext }
      };
    }

    // Default continuation response
    return {
      type: 'advice',
      message: 'I want to make sure I understand exactly what you need. Could you tell me a bit more about what you\'d like help with?',
      priority: 'medium',
      reasoning: 'Seeking clarification for better assistance',
      context: { userMessage, actionContext }
    };
  }

  private async generateNewApproach(adaptations: string[], behaviorData: any): Promise<any> {
    return {
      communicationFrequency: behaviorData.consistency > 80 ? 'normal' : 'reduced',
      suggestionComplexity: behaviorData.feedback.satisfaction > 4 ? 'advanced' : 'simple',
      motivationStyle: behaviorData.preferences?.communicationStyle || 'motivational'
    };
  }

  private async generatePersonalizedSuggestion(context: any, preferences: any, comprehensiveProfile?: any): Promise<string> {
    const goals = context.goals?.[0] || 'general fitness';
    const time = context.availableTime;
    
    let suggestion = `Based on your ${goals} goal and ${time} minutes available, I recommend a targeted session focusing on compound movements with progressive overload.`;
    
    if (comprehensiveProfile) {
      // Add specific recommendations based on brain dump
      const brainDump = comprehensiveProfile.brainDumpSections;
      
      if (brainDump.whatWorksForMe && brainDump.whatWorksForMe.includes('short')) {
        suggestion += "\n\nSince you mentioned short, intense workouts work best for you, this session will be high-intensity focused.";
      }
      
      if (brainDump.uniqueCircumstances && brainDump.uniqueCircumstances.includes('limited time')) {
        suggestion += "\n\nConsidering your time constraints, we'll focus on maximum efficiency with compound movements.";
      }
      
      // Add favorite exercises if available
      if (comprehensiveProfile.exerciseInsights.favoriteExercises.length > 0) {
        const favorites = comprehensiveProfile.exerciseInsights.favoriteExercises.slice(0, 2);
        suggestion += `\n\nIncorporating your favorite exercises: ${favorites.join(' and ')}.`;
      }
    }
    
    return suggestion;
  }

  private async generateNextStepsAfterAchievement(achievement: any): Promise<any[]> {
    return [
      { label: 'Set New Goal', payload: { type: 'goal_setting' } },
      { label: 'Share Achievement', payload: { type: 'share', achievement } },
      { label: 'Plan Next Phase', payload: { type: 'planning' } }
    ];
  }
}

export const agentOrchestrator = new AgentOrchestrator();