import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProactiveNotifications } from './ProactiveNotifications';
import { useAgent } from '../hooks/useAgent';
import { AgentResponse } from '../services/agentOrchestrator';
import { useAuth } from '../contexts/AuthContext';

interface AgentContextType {
  sendGlobalMessage: (message: string, context?: any) => Promise<AgentResponse>;
  celebrateGlobalAchievement: (achievement: any) => Promise<AgentResponse>;
  isAgentReady: boolean;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useGlobalAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useGlobalAgent must be used within AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: React.ReactNode;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(true);
  
  const {
    isInitialized,
    sendMessage,
    celebrateAchievement,
    proactiveMessages
  } = useAgent({
    currentScreen: 'Global'
  });

  useEffect(() => {
    // Start proactive monitoring when user is authenticated
    if (user && isInitialized) {
      // The agent will automatically start monitoring in the background
    }
  }, [user, isInitialized]);

  const sendGlobalMessage = async (message: string, context?: any): Promise<AgentResponse> => {
    return await sendMessage(message, context);
  };

  const celebrateGlobalAchievement = async (achievement: any): Promise<AgentResponse> => {
    return await celebrateAchievement(achievement);
  };

  const handleNotificationAction = (action: any) => {
    // Handle global notification actions
    console.log('Global notification action:', action);
  };

  const contextValue: AgentContextType = {
    sendGlobalMessage,
    celebrateGlobalAchievement,
    isAgentReady: isInitialized
  };

  return (
    <AgentContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}
        {user && showNotifications && proactiveMessages.length > 0 && (
          <ProactiveNotifications
            onActionPress={handleNotificationAction}
            maxVisible={2}
          />
        )}
      </View>
    </AgentContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});