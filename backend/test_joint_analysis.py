#!/usr/bin/env python3
"""
Test script for joint workout and nutrition analysis
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent))

from core.analyzer import WorkoutAnalyzer
from core.nutrition_analyzer import NutritionAnalyzer
from core.joint_analyzer import JointAnalyzer
from data.loaders import DataLoaderFactory
from data.nutrition_loader import NutritionLoaderFactory

def test_joint_analysis():
    """Test the joint analysis functionality."""
    print("🧪 Testing Joint Analysis Functionality")
    print("=" * 50)
    
    # Load sample workout data
    workout_file = "sample_workout_data.json"
    if not os.path.exists(workout_file):
        print(f"❌ Workout file {workout_file} not found")
        return
    
    # Load sample nutrition data
    nutrition_file = "sample_nutrition_data.json"
    if not os.path.exists(nutrition_file):
        print(f"❌ Nutrition file {nutrition_file} not found")
        return
    
    try:
        # Load workout data
        workout_loader = DataLoaderFactory.get_loader('.json')
        workout_data = workout_loader.load(workout_file)
        print(f"✅ Loaded workout data: {len(workout_data)} workouts")
        
        # Load nutrition data
        nutrition_loader = NutritionLoaderFactory.get_loader('.json')
        nutrition_data = nutrition_loader.load(nutrition_file)
        print(f"✅ Loaded nutrition data: {len(nutrition_data)} days")
        
        # Initialize analyzers
        workout_analyzer = WorkoutAnalyzer("dummy_key")
        workout_analyzer.workout_data = workout_data
        
        nutrition_analyzer = NutritionAnalyzer()
        nutrition_analyzer.load_nutrition_data(nutrition_data)
        
        joint_analyzer = JointAnalyzer(workout_analyzer, nutrition_analyzer)
        
        # Test nutrition analysis
        print("\n📊 NUTRITION ANALYSIS:")
        print("-" * 30)
        print(nutrition_analyzer.get_nutrition_summary())
        
        # Test daily analysis
        print("\n📅 DAILY JOINT ANALYSIS (2024-01-15):")
        print("-" * 40)
        daily_analysis = joint_analyzer.get_daily_analysis("2024-01-15")
        if daily_analysis.get('workout') and daily_analysis.get('nutrition'):
            print(f"Workout: {daily_analysis['workout'].get('workout_type', 'Unknown')}")
            print(f"Calories: {daily_analysis['nutrition'].get('calories', 0)} kcal")
            print(f"Protein: {daily_analysis['nutrition'].get('protein', 0)}g")
            print(f"Recovery Quality: {daily_analysis['recovery_analysis'].get('recovery_quality', 'Unknown')}")
            
            if daily_analysis.get('recommendations'):
                print("\nRecommendations:")
                for rec in daily_analysis['recommendations']:
                    print(f"• {rec}")
        else:
            print("No workout data for this date")
        
        # Test weekly joint analysis
        print("\n🔄 WEEKLY JOINT ANALYSIS:")
        print("-" * 30)
        weekly_analysis = joint_analyzer.get_weekly_joint_analysis()
        
        if weekly_analysis.get('correlation_insights', {}).get('insights'):
            print("Correlation Insights:")
            for insight in weekly_analysis['correlation_insights']['insights']:
                print(f"• {insight}")
        
        if weekly_analysis.get('weekly_recommendations'):
            print("\nWeekly Recommendations:")
            for rec in weekly_analysis['weekly_recommendations']:
                print(f"• {rec}")
        
        # Test joint summary
        print("\n📋 COMPREHENSIVE JOINT SUMMARY:")
        print("-" * 40)
        print(joint_analyzer.get_joint_summary())
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_joint_analysis() 