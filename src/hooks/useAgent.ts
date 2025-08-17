import { useState, useEffect, useCallback } from 'react';
import { agentOrchestrator, AgentResponse, AgentContext } from '../services/agentOrchestrator';
import { auth } from '../services/firebase';

export interface UseAgentReturn {
  isInitialized: boolean;
  sendMessage: (message: string, context?: any) => Promise<AgentResponse>;
  proactiveMessages: AgentResponse[];
  dismissMessage: (messageId: string) => void;
  celebrateAchievement: (achievement: any) => Promise<AgentResponse>;
  requestWorkoutSuggestion: (context: any) => Promise<AgentResponse>;
  handleEmergency: (scenario: any) => Promise<AgentResponse>;
  agentContext: Partial<AgentContext>;
  updateContext: (updates: Partial<AgentContext>) => void;
}

export const useAgent = (initialContext?: Partial<AgentContext>): UseAgentReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [proactiveMessages, setProactiveMessages] = useState<AgentResponse[]>([]);
  const [agentContext, setAgentContext] = useState<Partial<AgentContext>>(initialContext || {});

  useEffect(() => {
    const initializeAgent = async () => {
      if (auth.currentUser?.uid && !isInitialized) {
        try {
          await agentOrchestrator.initialize(auth.currentUser.uid, {
            ...initialContext,
            ...agentContext
          });
          setIsInitialized(true);
          
          startProactiveMonitoring();
        } catch (error) {
          console.error('Error initializing agent:', error);
        }
      }
    };

    initializeAgent();
  }, [auth.currentUser?.uid, initialContext, agentContext, isInitialized]);

  const startProactiveMonitoring = useCallback(() => {
    const checkProactive = async () => {
      try {
        const messages = await agentOrchestrator.runProactiveMonitoring();
        if (messages.length > 0) {
          setProactiveMessages(prev => {
            const newMessages = messages.filter(msg => 
              !prev.some(existing => 
                existing.message === msg.message && 
                existing.type === msg.type
              )
            );
            return [...prev, ...newMessages];
          });
        }
      } catch (error) {
        console.error('Error in proactive monitoring:', error);
      }
    };

    checkProactive();
    
    const interval = setInterval(checkProactive, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (
    message: string, 
    context?: any
  ): Promise<AgentResponse> => {
    if (!isInitialized) {
      throw new Error('Agent not initialized');
    }

    try {
      const response = await agentOrchestrator.processUserInteraction(message, context);
      return response;
    } catch (error) {
      console.error('Error sending message to agent:', error);
      return {
        type: 'advice',
        message: 'Sorry, I encountered an issue. Please try again.',
        priority: 'low',
        reasoning: 'Error handling user message',
        context: {}
      };
    }
  }, [isInitialized]);

  const dismissMessage = useCallback((messageId: string) => {
    setProactiveMessages(prev => prev.filter((_, index) => index.toString() !== messageId));
  }, []);

  const celebrateAchievement = useCallback(async (achievement: {
    type: 'goal_reached' | 'streak' | 'personal_best' | 'consistency';
    value: any;
    context: any;
  }): Promise<AgentResponse> => {
    if (!isInitialized) {
      throw new Error('Agent not initialized');
    }

    try {
      const response = await agentOrchestrator.celebrateAchievement(achievement);
      return response;
    } catch (error) {
      console.error('Error celebrating achievement:', error);
      return {
        type: 'celebration',
        message: 'Congratulations on your achievement!',
        priority: 'high',
        reasoning: 'Fallback celebration',
        context: achievement
      };
    }
  }, [isInitialized]);

  const requestWorkoutSuggestion = useCallback(async (context: {
    previousWorkouts?: any[];
    availableTime: number;
    equipment: string[];
    goals: string[];
  }): Promise<AgentResponse> => {
    if (!isInitialized) {
      throw new Error('Agent not initialized');
    }

    try {
      const response = await agentOrchestrator.generateWorkoutSuggestion({
        previousWorkouts: [],
        ...context
      });
      return response;
    } catch (error) {
      console.error('Error requesting workout suggestion:', error);
      return {
        type: 'suggestion',
        message: 'I recommend a balanced workout focusing on your main muscle groups.',
        priority: 'medium',
        reasoning: 'Fallback workout suggestion',
        context: {}
      };
    }
  }, [isInitialized]);

  const handleEmergency = useCallback(async (scenario: {
    type: 'injury' | 'equipment_failure' | 'time_constraint' | 'motivation_crisis';
    severity: 'low' | 'medium' | 'high';
    context: any;
  }): Promise<AgentResponse> => {
    if (!isInitialized) {
      throw new Error('Agent not initialized');
    }

    try {
      const response = await agentOrchestrator.handleEmergencyScenario(scenario);
      return response;
    } catch (error) {
      console.error('Error handling emergency:', error);
      return {
        type: 'intervention',
        message: 'Take a moment to assess the situation. Your safety and well-being come first.',
        priority: 'high',
        reasoning: 'Fallback emergency response',
        context: scenario
      };
    }
  }, [isInitialized]);

  const updateContext = useCallback((updates: Partial<AgentContext>) => {
    setAgentContext(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    isInitialized,
    sendMessage,
    proactiveMessages,
    dismissMessage,
    celebrateAchievement,
    requestWorkoutSuggestion,
    handleEmergency,
    agentContext,
    updateContext
  };
};