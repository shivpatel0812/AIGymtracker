import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  SegmentedButtons,
  useTheme,
  ProgressBar,
  IconButton,
  Divider,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ComprehensiveUserProfile } from '../types';
import { RootStackParamList } from '../types/navigation';
import { colors } from '../config/theme';
import { 
  saveComprehensiveProfile, 
  getComprehensiveProfile,
  getProfileCompleteness 
} from '../services/comprehensiveProfile';

type ComprehensiveProfileNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ComprehensiveProfile'
>;

type Step = 
  | 'basic_info'
  | 'fitness_goals'
  | 'exercise_insights'
  | 'nutrition_insights'
  | 'personal_insights'
  | 'brain_dump'
  | 'preferences';

const steps: Array<{ key: Step; title: string; description: string }> = [
  { key: 'basic_info', title: 'Basic Info', description: 'Tell us about yourself' },
  { key: 'fitness_goals', title: 'Fitness Goals', description: 'What do you want to achieve?' },
  { key: 'exercise_insights', title: 'Exercise Experience', description: 'Your workout preferences & history' },
  { key: 'nutrition_insights', title: 'Nutrition', description: 'Diet preferences & sensitivities' },
  { key: 'personal_insights', title: 'Personal Insights', description: 'Lifestyle & growth patterns' },
  { key: 'brain_dump', title: 'Brain Dump', description: 'Share your detailed experiences' },
  { key: 'preferences', title: 'Coaching Style', description: 'How should I coach you?' },
];

export const ComprehensiveProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ComprehensiveProfileNavigationProp>();
  const [currentStep, setCurrentStep] = useState<Step>('basic_info');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ComprehensiveUserProfile>({
    basicInfo: {
      activityLevel: 'moderately_active',
      fitnessExperience: 'intermediate',
    },
    fitnessGoals: {
      primaryGoal: 'body_recomposition',
      specificTargets: {},
    },
    exerciseInsights: {
      favoriteExercises: [],
      leastFavoriteExercises: [],
      exerciseResponses: [],
      workoutPreferences: {
        preferredSplit: 'PPL',
        sessionDuration: '60min',
        intensityPreference: 'moderate',
        equipmentAccess: [],
      },
      injuryHistory: [],
    },
    nutritionInsights: {
      dietaryRestrictions: [],
      allergies: [],
      foodSensitivities: [],
      nutritionPreferences: {
        mealFrequency: '3_meals',
        cookingLevel: 'basic',
        budgetLevel: 'moderate',
        supplementUsage: [],
      },
      dietHistory: [],
    },
    personalInsights: {
      motivationTriggers: [],
      stressFactors: [],
      lifeCircumstances: {
        workSchedule: 'regular_9_5',
        sleepSchedule: 'early_bird',
        familyCommitments: 'minimal',
        travelFrequency: 'occasional',
      },
      growthPatterns: [],
      mentalAspects: {
        relationshipWithFood: '',
        relationshipWithExercise: '',
        stressEating: false,
        emotionalTriggers: [],
        copingMechanisms: [],
      },
    },
    preferences: {
      communicationStyle: 'motivational',
      feedbackStyle: 'direct',
      coachingApproach: 'supportive',
      dataTracking: 'moderate',
    },
    brainDumpSections: {
      workoutExperiences: '',
      nutritionExperiences: '',
      bodyChangesObservations: '',
      whatWorksForMe: '',
      whatDoesntWork: '',
      uniqueCircumstances: '',
      personalTheories: '',
      questionsForCoach: '',
    },
    profileCompleteness: {
      lastUpdated: new Date().toISOString(),
      sectionsCompleted: [],
      overallCompleteness: 0,
    },
  });

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = (currentStepIndex + 1) / steps.length;
  const currentStepInfo = steps[currentStepIndex];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={colors.neonCyan} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  const updateProfile = (section: keyof ComprehensiveUserProfile, data: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), ...data },
      profileCompleteness: {
        ...prev.profileCompleteness,
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await saveComprehensiveProfile(profile);
      Alert.alert('Profile Saved', 'Your comprehensive profile has been saved! The AI coach will now provide highly personalized recommendations.');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    setIsLoading(true);
    try {
      const existingProfile = await getComprehensiveProfile();
      if (existingProfile) {
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('Error loading existing profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
      
      <TextInput
        label="Age"
        value={profile.basicInfo.age?.toString() || ''}
        onChangeText={(text) => updateProfile('basicInfo', { age: parseInt(text) || undefined })}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <TextInput
        label="Height (inches)"
        value={profile.basicInfo.height?.toString() || ''}
        onChangeText={(text) => updateProfile('basicInfo', { height: parseInt(text) || undefined })}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <TextInput
        label="Current Weight (lbs)"
        value={profile.basicInfo.currentWeight?.toString() || ''}
        onChangeText={(text) => updateProfile('basicInfo', { currentWeight: parseInt(text) || undefined })}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text variant="bodyMedium" style={styles.label}>Activity Level</Text>
      <SegmentedButtons
        value={profile.basicInfo.activityLevel}
        onValueChange={(value) => updateProfile('basicInfo', { activityLevel: value })}
        buttons={[
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly_active', label: 'Light' },
          { value: 'moderately_active', label: 'Moderate' },
          { value: 'very_active', label: 'Active' },
          { value: 'extremely_active', label: 'Very Active' },
        ]}
        style={styles.segmentedButtons}
      />

      <Text variant="bodyMedium" style={styles.label}>Fitness Experience</Text>
      <SegmentedButtons
        value={profile.basicInfo.fitnessExperience}
        onValueChange={(value) => updateProfile('basicInfo', { fitnessExperience: value })}
        buttons={[
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' },
          { value: 'expert', label: 'Expert' },
        ]}
        style={styles.segmentedButtons}
      />
      
      <TextInput
        label="Years of Training"
        value={profile.basicInfo.trainingYears?.toString() || ''}
        onChangeText={(text) => updateProfile('basicInfo', { trainingYears: parseInt(text) || undefined })}
        keyboardType="numeric"
        style={styles.input}
      />
    </View>
  );

  const renderBrainDump = () => (
    <ScrollView style={styles.stepContent}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Brain Dump - Share Everything!</Text>
      <Text variant="bodySmall" style={styles.description}>
        This is your space to share detailed experiences, observations, and insights that will help create the most personalized coaching possible.
      </Text>

      <TextInput
        label="Workout Experiences"
        placeholder="e.g., 'Dips make my triceps grow more than any other exercise', 'I respond better to higher volume on legs', 'Morning workouts give me more energy'"
        value={profile.brainDumpSections.workoutExperiences}
        onChangeText={(text) => updateProfile('brainDumpSections', { workoutExperiences: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="Nutrition Experiences"
        placeholder="e.g., 'Eating carbs at night helps me sleep better', 'Too much dairy makes me bloated', 'I lose weight faster with intermittent fasting'"
        value={profile.brainDumpSections.nutritionExperiences}
        onChangeText={(text) => updateProfile('brainDumpSections', { nutritionExperiences: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="Body Changes Observations"
        placeholder="e.g., 'I tend to lose weight in my face first', 'My legs grow faster than my upper body', 'I hold fat in my lower belly last'"
        value={profile.brainDumpSections.bodyChangesObservations}
        onChangeText={(text) => updateProfile('brainDumpSections', { bodyChangesObservations: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="What Works For Me"
        placeholder="e.g., 'Short, intense workouts over long sessions', 'Tracking everything vs intuitive eating', 'Specific strategies that have been successful'"
        value={profile.brainDumpSections.whatWorksForMe}
        onChangeText={(text) => updateProfile('brainDumpSections', { whatWorksForMe: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="What Doesn't Work"
        placeholder="e.g., 'Very low carb makes me feel weak', 'Training legs 2x per week is too much for recovery', 'Meal prep stresses me out'"
        value={profile.brainDumpSections.whatDoesntWork}
        onChangeText={(text) => updateProfile('brainDumpSections', { whatDoesntWork: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="Unique Circumstances"
        placeholder="e.g., 'I work night shifts', 'I travel 50% of the time', 'I have young kids and limited time', 'I live in a small apartment'"
        value={profile.brainDumpSections.uniqueCircumstances}
        onChangeText={(text) => updateProfile('brainDumpSections', { uniqueCircumstances: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="Personal Theories"
        placeholder="e.g., 'I think I need more rest than most people', 'I believe I'm carb sensitive', 'I think stress affects my weight more than diet'"
        value={profile.brainDumpSections.personalTheories}
        onChangeText={(text) => updateProfile('brainDumpSections', { personalTheories: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TextInput
        label="Questions for Your AI Coach"
        placeholder="e.g., 'How can I break through my bench plateau?', 'Why do I always crave sugar in the evening?', 'What's the best split for my schedule?'"
        value={profile.brainDumpSections.questionsForCoach}
        onChangeText={(text) => updateProfile('brainDumpSections', { questionsForCoach: text })}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic_info':
        return renderBasicInfo();
      case 'brain_dump':
        return renderBrainDump();
      default:
        return (
          <View style={styles.stepContent}>
            <Text variant="titleMedium">{currentStepInfo.title}</Text>
            <Text variant="bodyMedium" style={styles.description}>
              This section is under development. The brain dump section above captures the core functionality you requested.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineSmall" style={styles.title}>
            Complete Your Profile
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ProgressBar progress={progress} style={styles.progressBar} />
        
        <View style={styles.stepInfo}>
          <Text variant="titleMedium">{currentStepInfo.title}</Text>
          <Text variant="bodySmall" style={styles.stepDescription}>
            {currentStepInfo.description}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={goToPreviousStep}
          disabled={currentStepIndex === 0}
          style={styles.footerButton}
        >
          Previous
        </Button>
        
        {currentStepIndex === steps.length - 1 ? (
          <Button
            mode="contained"
            onPress={saveProfile}
            style={styles.footerButton}
            loading={isSaving}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={goToNextStep}
            style={styles.footerButton}
          >
            Next
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
  },
  progressBar: {
    marginVertical: 16,
    height: 6,
    borderRadius: 3,
  },
  stepInfo: {
    alignItems: 'center',
  },
  stepDescription: {
    color: '#B0B0B0',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  description: {
    color: '#B0B0B0',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 20,
    minHeight: 100,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#B0B0B0',
  },
});