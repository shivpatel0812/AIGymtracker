import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Button, Chip, Portal, Modal, TextInput } from 'react-native-paper';
import { useAgent } from '../hooks/useAgent';
import { AgentResponse } from '../services/agentOrchestrator';

interface AgentInterfaceProps {
  visible: boolean;
  onDismiss: () => void;
  currentScreen?: string;
  contextData?: any;
}

export const AgentInterface: React.FC<AgentInterfaceProps> = ({
  visible,
  onDismiss,
  currentScreen,
  contextData
}) => {
  const {
    isInitialized,
    sendMessage,
    proactiveMessages,
    dismissMessage,
    celebrateAchievement,
    requestWorkoutSuggestion,
    handleEmergency,
    updateContext
  } = useAgent({ currentScreen });

  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'agent';
    message: string;
    response?: AgentResponse;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentScreen || contextData) {
      updateContext({
        currentScreen,
        sessionData: contextData,
        environmentFactors: {
          timeOfDay: new Date().toLocaleTimeString()
        }
      });
    }
  }, [currentScreen, contextData, updateContext]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !isInitialized) return;

    const message = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    setChatHistory(prev => [...prev, {
      type: 'user',
      message,
      timestamp: new Date()
    }]);

    try {
      const response = await sendMessage(message, {
        screen: currentScreen,
        data: contextData
      });

      setChatHistory(prev => [...prev, {
        type: 'agent',
        message: response.message,
        response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get response from agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionType: string) => {
    setIsLoading(true);
    try {
      let response: AgentResponse;

      switch (actionType) {
        case 'workout_suggestion':
          response = await requestWorkoutSuggestion({
            availableTime: 45,
            equipment: ['bodyweight', 'dumbbells'],
            goals: ['strength', 'endurance']
          });
          break;
        case 'motivation_help':
          response = await handleEmergency({
            type: 'motivation_crisis',
            severity: 'medium',
            context: { currentScreen, contextData }
          });
          break;
        case 'progress_celebration':
          response = await celebrateAchievement({
            type: 'consistency',
            value: 85,
            context: { period: 'week' }
          });
          break;
        default:
          response = await sendMessage(`Help with ${actionType}`);
      }

      setChatHistory(prev => [...prev, {
        type: 'agent',
        message: response.message,
        response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error with quick action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionButton = async (action: any) => {
    try {
      const response = await sendMessage(`Execute action: ${action.type}`, {
        action: action.payload
      });

      setChatHistory(prev => [...prev, {
        type: 'agent',
        message: response.message,
        response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const renderMessage = (item: typeof chatHistory[0], index: number) => (
    <Card key={index} style={[
      styles.messageCard,
      item.type === 'user' ? styles.userMessage : styles.agentMessage
    ]}>
      <Card.Content>
        <Text style={[
          styles.messageText,
          item.type === 'user' ? styles.userText : styles.agentText
        ]}>
          {item.message}
        </Text>
        
        {item.response?.actions && (
          <View style={styles.actionsContainer}>
            {item.response.actions.map((action, actionIndex) => (
              <Button
                key={actionIndex}
                mode="outlined"
                onPress={() => handleActionButton(action)}
                style={styles.actionButton}
                compact
              >
                {action.label}
              </Button>
            ))}
          </View>
        )}
        
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString()}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderProactiveMessage = (message: AgentResponse, index: number) => (
    <Card key={index} style={[styles.messageCard, styles.proactiveMessage]}>
      <Card.Content>
        <View style={styles.proactiveHeader}>
          <Chip 
            mode="outlined" 
            style={[styles.priorityChip, styles[`priority${message.priority}`]]}
          >
            {message.priority.toUpperCase()}
          </Chip>
          <TouchableOpacity onPress={() => dismissMessage(index.toString())}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.proactiveText}>{message.message}</Text>
        
        {message.actions && (
          <View style={styles.actionsContainer}>
            {message.actions.map((action, actionIndex) => (
              <Button
                key={actionIndex}
                mode="contained"
                onPress={() => handleActionButton(action)}
                style={styles.actionButton}
                compact
              >
                {action.label}
              </Button>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (!isInitialized) {
    return (
      <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
          <Text style={styles.loadingText}>Initializing your AI fitness coach...</Text>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Your AI Fitness Coach</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {proactiveMessages.length > 0 && (
            <View style={styles.proactiveSection}>
              <Text style={styles.sectionTitle}>Proactive Suggestions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {proactiveMessages.map((message, index) => renderProactiveMessage(message, index))}
              </ScrollView>
            </View>
          )}

          <ScrollView style={styles.chatContainer}>
            {chatHistory.map((item, index) => renderMessage(item, index))}
          </ScrollView>

          <View style={styles.quickActions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Button
                mode="outlined"
                onPress={() => handleQuickAction('workout_suggestion')}
                style={styles.quickActionButton}
                compact
              >
                Suggest Workout
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleQuickAction('motivation_help')}
                style={styles.quickActionButton}
                compact
              >
                Need Motivation
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleQuickAction('progress_celebration')}
                style={styles.quickActionButton}
                compact
              >
                Celebrate Progress
              </Button>
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Ask your AI coach anything..."
              style={styles.textInput}
              mode="outlined"
              multiline
              disabled={isLoading}
            />
            <Button
              mode="contained"
              onPress={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              style={styles.sendButton}
              loading={isLoading}
            >
              Send
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    maxHeight: '90%',
  },
  container: {
    flex: 1,
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 40,
  },
  proactiveSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  messageCard: {
    marginBottom: 10,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  agentMessage: {
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  proactiveMessage: {
    backgroundColor: '#FFF3CD',
    marginRight: 10,
    minWidth: 200,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  agentText: {
    color: '#333',
  },
  proactiveText: {
    color: '#333',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  proactiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityChip: {
    height: 24,
  },
  priorityhigh: {
    backgroundColor: '#FFE6E6',
  },
  prioritymedium: {
    backgroundColor: '#FFF8E1',
  },
  prioritylow: {
    backgroundColor: '#E8F5E8',
  },
  dismissText: {
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 4,
  },
  quickActions: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickActionButton: {
    marginRight: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    minWidth: 60,
  },
});