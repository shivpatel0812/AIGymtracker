import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton, useTheme } from 'react-native-paper';
import { useAgent } from '../hooks/useAgent';
import { AgentResponse } from '../services/agentOrchestrator';

interface ProactiveNotificationsProps {
  onActionPress?: (action: any) => void;
  maxVisible?: number;
}

export const ProactiveNotifications: React.FC<ProactiveNotificationsProps> = ({
  onActionPress,
  maxVisible = 3
}) => {
  const theme = useTheme();
  const { proactiveMessages, dismissMessage } = useAgent();
  const [visibleMessages, setVisibleMessages] = useState<AgentResponse[]>([]);
  const [animations, setAnimations] = useState<Map<string, Animated.Value>>(new Map());

  useEffect(() => {
    const newMessages = proactiveMessages.slice(0, maxVisible);
    setVisibleMessages(newMessages);
    
    // Create animations for new messages
    newMessages.forEach((message, index) => {
      const messageId = `${message.type}_${index}`;
      if (!animations.has(messageId)) {
        const animValue = new Animated.Value(0);
        setAnimations(prev => new Map(prev.set(messageId, animValue)));
        
        // Animate in
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    });
  }, [proactiveMessages, maxVisible]);

  const handleDismiss = (messageIndex: number) => {
    const messageId = `${visibleMessages[messageIndex].type}_${messageIndex}`;
    const animValue = animations.get(messageId);
    
    if (animValue) {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        dismissMessage(messageIndex.toString());
        setAnimations(prev => {
          const newMap = new Map(prev);
          newMap.delete(messageId);
          return newMap;
        });
      });
    } else {
      dismissMessage(messageIndex.toString());
    }
  };

  const handleActionPress = (action: any, messageIndex: number) => {
    onActionPress?.(action);
    handleDismiss(messageIndex);
  };

  const getPriorityColor = (priority: AgentResponse['priority']) => {
    switch (priority) {
      case 'high': return '#FFE6E6';
      case 'medium': return '#FFF8E1';
      case 'low': return '#E8F5E8';
      default: return theme.colors.surface;
    }
  };

  const getPriorityIcon = (type: AgentResponse['type']) => {
    switch (type) {
      case 'suggestion': return 'lightbulb-outline';
      case 'intervention': return 'alert-circle-outline';
      case 'celebration': return 'trophy-outline';
      case 'advice': return 'information-outline';
      case 'question': return 'help-circle-outline';
      default: return 'robot-outline';
    }
  };

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleMessages.map((message, index) => {
        const messageId = `${message.type}_${index}`;
        const animValue = animations.get(messageId) || new Animated.Value(1);
        
        return (
          <Animated.View
            key={messageId}
            style={[
              styles.messageContainer,
              {
                transform: [
                  {
                    translateY: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                  {
                    scale: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: animValue,
              },
            ]}
          >
            <Card 
              style={[
                styles.messageCard,
                { backgroundColor: getPriorityColor(message.priority) }
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <IconButton
                      icon={getPriorityIcon(message.type)}
                      size={20}
                      iconColor={message.priority === 'high' ? '#D32F2F' : '#1976D2'}
                      style={styles.typeIcon}
                    />
                    <View style={styles.headerText}>
                      <Text variant="labelSmall" style={styles.priorityLabel}>
                        {message.priority.toUpperCase()} PRIORITY
                      </Text>
                      <Text variant="labelMedium" style={styles.typeLabel}>
                        {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <IconButton
                    icon="close"
                    size={18}
                    onPress={() => handleDismiss(index)}
                    style={styles.dismissButton}
                  />
                </View>
                
                <Text variant="bodyMedium" style={styles.messageText}>
                  {message.message}
                </Text>
                
                {message.actions && message.actions.length > 0 && (
                  <View style={styles.actionsContainer}>
                    {message.actions.slice(0, 2).map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        mode={actionIndex === 0 ? "contained" : "outlined"}
                        onPress={() => handleActionPress(action, index)}
                        style={[
                          styles.actionButton,
                          actionIndex === 0 && styles.primaryAction
                        ]}
                        contentStyle={styles.actionButtonContent}
                        compact
                      >
                        {action.label}
                      </Button>
                    ))}
                  </View>
                )}
                
                {message.reasoning && (
                  <Text variant="bodySmall" style={styles.reasoning}>
                    💡 {message.reasoning}
                  </Text>
                )}
              </Card.Content>
            </Card>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  messageContainer: {
    marginBottom: 8,
  },
  messageCard: {
    elevation: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    margin: 0,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  priorityLabel: {
    color: '#666',
    fontWeight: '600',
  },
  typeLabel: {
    color: '#333',
    fontWeight: '500',
  },
  dismissButton: {
    margin: 0,
    marginLeft: 8,
  },
  messageText: {
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
  },
  primaryAction: {
    backgroundColor: '#1976D2',
  },
  actionButtonContent: {
    paddingVertical: 4,
  },
  reasoning: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});