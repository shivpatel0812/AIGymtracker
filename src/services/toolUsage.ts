import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface ExternalTool {
  id: string;
  name: string;
  type: 'calendar' | 'weather' | 'nutrition' | 'research';
  apiEndpoint?: string;
  isEnabled: boolean;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
  reminder?: {
    minutes: number;
  };
}

export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  humidity: number;
  windSpeed: number;
  suitableForOutdoor: boolean;
}

export interface NutritionData {
  food: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  micronutrients?: {
    [key: string]: number;
  };
}

export interface ResearchResult {
  title: string;
  summary: string;
  source: string;
  relevanceScore: number;
  publishedDate?: string;
}

class ToolUsageService {
  private weatherApiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
  private nutritionApiKey = process.env.EXPO_PUBLIC_NUTRITION_API_KEY;

  async scheduleWorkout(event: CalendarEvent): Promise<string> {
    try {
      await this.requestCalendarPermissions();
      
      const notification = await Notifications.scheduleNotificationAsync({
        content: {
          title: event.title,
          body: event.description || 'Time for your workout!',
        },
        trigger: {
          date: new Date(event.startDate),
        },
      });

      return notification;
    } catch (error) {
      console.error('Error scheduling workout:', error);
      throw error;
    }
  }

  async getWeatherForWorkout(location?: string): Promise<WeatherData> {
    try {
      if (!this.weatherApiKey) {
        console.warn('Weather API key not configured');
        return this.getDefaultWeatherData();
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location || 'current'}&appid=${this.weatherApiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        temperature: data.main?.temp || 20,
        condition: this.mapWeatherCondition(data.weather?.[0]?.main || 'Clear'),
        humidity: data.main?.humidity || 50,
        windSpeed: data.wind?.speed || 5,
        suitableForOutdoor: this.isWeatherSuitableForOutdoor(data)
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getDefaultWeatherData();
    }
  }

  private getDefaultWeatherData(): WeatherData {
    return {
      temperature: 20,
      condition: 'cloudy',
      humidity: 50,
      windSpeed: 5,
      suitableForOutdoor: true
    };
  }

  async searchFoodNutrition(foodName: string): Promise<NutritionData | null> {
    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&api_key=${this.nutritionApiKey}&pageSize=1`
      );
      
      const data = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        const nutrients = food.foodNutrients;
        
        return {
          food: food.description,
          calories: this.getNutrientValue(nutrients, 'Energy') || 0,
          macros: {
            protein: this.getNutrientValue(nutrients, 'Protein') || 0,
            carbs: this.getNutrientValue(nutrients, 'Carbohydrate') || 0,
            fat: this.getNutrientValue(nutrients, 'Total lipid (fat)') || 0,
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error searching nutrition data:', error);
      return null;
    }
  }

  async researchFitnessTopics(query: string): Promise<ResearchResult[]> {
    try {
      const response = await fetch(
        `https://api.crossref.org/works?query=${encodeURIComponent(query + ' fitness exercise')}&rows=5&sort=relevance&order=desc`
      );
      
      const data = await response.json();
      
      return data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Unknown Title',
        summary: item.abstract || 'No summary available',
        source: item.publisher || 'Unknown Publisher',
        relevanceScore: item.score || 0,
        publishedDate: item.published?.['date-parts']?.[0]?.join('-')
      }));
    } catch (error) {
      console.error('Error researching fitness topics:', error);
      return [];
    }
  }

  async generateWorkoutAlternatives(
    originalExercise: string,
    reason: 'weather' | 'equipment' | 'injury' | 'preference'
  ): Promise<string[]> {
    const alternatives: { [key: string]: { [key: string]: string[] } } = {
      weather: {
        'running': ['treadmill running', 'indoor cycling', 'stair climbing'],
        'outdoor cycling': ['stationary bike', 'indoor rowing', 'jump rope'],
        'hiking': ['stair climbing', 'incline walking', 'step-ups']
      },
      equipment: {
        'bench press': ['push-ups', 'dumbbell press', 'resistance band press'],
        'pull-ups': ['resistance band rows', 'dumbbell rows', 'bodyweight rows'],
        'squats': ['bodyweight squats', 'lunges', 'single-leg squats']
      },
      injury: {
        'running': ['swimming', 'cycling', 'elliptical'],
        'deadlifts': ['glute bridges', 'hip thrusts', 'reverse flies'],
        'overhead press': ['lateral raises', 'front raises', 'resistance band press']
      }
    };

    const exerciseKey = Object.keys(alternatives[reason] || {}).find(key =>
      originalExercise.toLowerCase().includes(key.toLowerCase())
    );

    return exerciseKey ? alternatives[reason][exerciseKey] : [
      'bodyweight alternative',
      'resistance band exercise',
      'modified movement pattern'
    ];
  }

  async setWorkoutReminders(
    schedule: Array<{ day: string; time: string; type: string }>
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const workout of schedule) {
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${workout.type} Workout Reminder`,
            body: 'Time to crush your fitness goals!',
          },
          trigger: {
            weekday: this.getDayNumber(workout.day),
            hour: parseInt(workout.time.split(':')[0]),
            minute: parseInt(workout.time.split(':')[1]),
            repeats: true,
          },
        });
        notificationIds.push(notificationId);
      } catch (error) {
        console.error('Error setting workout reminder:', error);
      }
    }

    return notificationIds;
  }

  private async requestCalendarPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const { PermissionsAndroid } = require('react-native');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.warn('Calendar permissions not available on this platform');
        return false;
      }
    }
    return true;
  }

  private mapWeatherCondition(condition: string): WeatherData['condition'] {
    const conditionMap: { [key: string]: WeatherData['condition'] } = {
      'Clear': 'sunny',
      'Clouds': 'cloudy',
      'Rain': 'rainy',
      'Snow': 'snowy'
    };
    return conditionMap[condition] || 'cloudy';
  }

  private isWeatherSuitableForOutdoor(weatherData: any): boolean {
    const temp = weatherData.main.temp;
    const condition = weatherData.weather[0].main;
    
    return temp > 5 && temp < 35 && !['Rain', 'Snow', 'Thunderstorm'].includes(condition);
  }

  private getNutrientValue(nutrients: any[], nutrientName: string): number {
    const nutrient = nutrients.find(n => 
      n.nutrientName.toLowerCase().includes(nutrientName.toLowerCase())
    );
    return nutrient?.value || 0;
  }

  private getDayNumber(day: string): number {
    const days: { [key: string]: number } = {
      'sunday': 1,
      'monday': 2,
      'tuesday': 3,
      'wednesday': 4,
      'thursday': 5,
      'friday': 6,
      'saturday': 7
    };
    return days[day.toLowerCase()] || 1;
  }
}

export const toolUsageService = new ToolUsageService();