import os
import sys
from pathlib import Path
from dotenv import load_dotenv

from core.analyzer import WorkoutAnalyzer
from core.nutrition_analyzer import NutritionAnalyzer
from core.sleep_analyzer import SleepAnalyzer
from core.stress_analyzer import StressAnalyzer
from core.hydration_analyzer import HydrationAnalyzer
from core.comprehensive_analyzer import ComprehensiveAnalyzer
from data.loaders import DataLoaderFactory
from data.nutrition_loader import NutritionLoaderFactory
from data.sleep_loader import SleepLoaderFactory
from data.stress_loader import StressLoaderFactory
from data.hydration_loader import HydrationLoaderFactory
from metrics.workout_metrics import WorkoutMetrics
from config.settings import Settings

# Load environment variables from .env file
load_dotenv()

class GymApp:
    def __init__(self, api_key: str):
        self.analyzer = WorkoutAnalyzer(api_key)
        self.nutrition_analyzer = NutritionAnalyzer()
        self.sleep_analyzer = SleepAnalyzer()
        self.stress_analyzer = StressAnalyzer()
        self.hydration_analyzer = HydrationAnalyzer()
        self.comprehensive_analyzer = ComprehensiveAnalyzer(self.analyzer, self.nutrition_analyzer, self.sleep_analyzer, self.stress_analyzer, self.hydration_analyzer)
        self.metrics = None
        self.workout_data = None
        self.nutrition_data = None
        self.sleep_data = None
        self.stress_data = None
        self.hydration_data = None
    
    def load_workout_data(self, file_path: str) -> bool:
        try:
            file_extension = Path(file_path).suffix
            loader = DataLoaderFactory.get_loader(file_extension)
            
            self.workout_data = loader.load(file_path)
            
            if not loader.validate(self.workout_data):
                print("❌ Invalid workout data format")
                return False
            
            self.analyzer.workout_data = self.workout_data
            self.metrics = WorkoutMetrics(self.workout_data)
            
            self._print_loading_summary()
            return True
            
        except Exception as e:
            print(f"❌ Error loading workout data: {e}")
            return False
    
    def load_nutrition_data(self, file_path: str) -> bool:
        try:
            file_extension = Path(file_path).suffix
            loader = NutritionLoaderFactory.get_loader(file_extension)
            
            self.nutrition_data = loader.load(file_path)
            
            if not loader.validate(self.nutrition_data):
                print("❌ Invalid nutrition data format")
                return False
            
            self.nutrition_analyzer.load_nutrition_data(self.nutrition_data)
            
            self._print_nutrition_loading_summary()
            return True
            
        except Exception as e:
            print(f"❌ Error loading nutrition data: {e}")
            return False
    
    def load_sleep_data(self, file_path: str) -> bool:
        try:
            file_extension = Path(file_path).suffix
            loader = SleepLoaderFactory.get_loader(file_extension)
            
            self.sleep_data = loader.load(file_path)
            
            if not loader.validate(self.sleep_data):
                print("❌ Invalid sleep data format")
                return False
            
            self.sleep_analyzer.load_sleep_data(self.sleep_data)
            
            self._print_sleep_loading_summary()
            return True
            
        except Exception as e:
            print(f"❌ Error loading sleep data: {e}")
            return False
    
    def load_stress_data(self, file_path: str) -> bool:
        try:
            file_extension = Path(file_path).suffix
            loader = StressLoaderFactory.get_loader(file_extension)
            
            self.stress_data = loader.load(file_path)
            
            if not loader.validate(self.stress_data):
                print("❌ Invalid stress data format")
                return False
            
            self.stress_analyzer.load_stress_data(self.stress_data)
            
            self._print_stress_loading_summary()
            return True
            
        except Exception as e:
            print(f"❌ Error loading stress data: {e}")
            return False
    
    def load_hydration_data(self, file_path: str) -> bool:
        try:
            file_extension = Path(file_path).suffix
            loader = HydrationLoaderFactory.get_loader(file_extension)
            
            self.hydration_data = loader.load(file_path)
            
            if not loader.validate(self.hydration_data):
                print("❌ Invalid hydration data format")
                return False
            
            self.hydration_analyzer.load_hydration_data(self.hydration_data)
            
            self._print_hydration_loading_summary()
            return True
            
        except Exception as e:
            print(f"❌ Error loading hydration data: {e}")
            return False
    
    def set_user_profile(self, **kwargs):
        self.analyzer.set_user_profile(**kwargs)
    
    def analyze_workouts(self, focus_areas=None):
        nutrition_context = None
        sleep_context = None
        stress_context = None
        
        if self.nutrition_data:
            weekly_avg = self.nutrition_analyzer.get_weekly_averages()
            if weekly_avg:
                nutrition_context = f"Weekly averages: {weekly_avg['avg_calories']} kcal, {weekly_avg['avg_protein']}g protein, {weekly_avg['avg_carbs']}g carbs, {weekly_avg['avg_fat']}g fat"
        
        if self.sleep_data:
            weekly_avg = self.sleep_analyzer.get_weekly_averages()
            if weekly_avg:
                sleep_context = f"Weekly averages: {weekly_avg['avg_sleep_hours']} hours sleep, quality: {weekly_avg['avg_sleep_quality']}/10"
        
        if self.stress_data:
            weekly_avg = self.stress_analyzer.get_weekly_averages()
            if weekly_avg:
                stress_context = f"Weekly average stress level: {weekly_avg['avg_stress_level']}/10"
        
        if self.hydration_data:
            weekly_avg = self.hydration_analyzer.get_weekly_averages()
            if weekly_avg:
                hydration_context = f"Weekly average water intake: {weekly_avg['avg_water_intake']} liters, quality: {weekly_avg['avg_hydration_quality']}/10"
        
        return self.analyzer.analyze_workouts(focus_areas, nutrition_context, sleep_context, stress_context, hydration_context)
    
    def get_predictions(self):
        return self.analyzer.get_next_workout_predictions()
    
    def get_metrics(self):
        if not self.metrics:
            return "❌ No workout data loaded"
        
        return {
            'volume_progression': self.metrics.calculate_volume_progression(),
            'frequency_analysis': self.metrics.calculate_frequency_analysis(),
            'workout_type_balance': self.metrics.calculate_workout_type_balance(),
            'exercise_progression': self.metrics.calculate_exercise_progression(),
            'fatigue_patterns': self.metrics.calculate_fatigue_patterns()
        }
    
    def get_comprehensive_analysis(self):
        """Get comprehensive analysis combining all data sources."""
        if not self.workout_data:
            return "❌ Need workout data for comprehensive analysis"
        
        return self.comprehensive_analyzer.get_comprehensive_summary()
    
    def get_daily_comprehensive_analysis(self, date: str):
        """Get daily comprehensive analysis for a specific date."""
        if not self.workout_data:
            return "❌ Need workout data for daily analysis"
        
        return self.comprehensive_analyzer.get_daily_comprehensive_analysis(date)
    
    def _print_loading_summary(self):
        if isinstance(self.workout_data, list):
            total_exercises = sum(len(w.get('exercises', [])) for w in self.workout_data)
            workout_sessions = len(self.workout_data)
        else:
            total_exercises = len(self.workout_data.get('exercises', []))
            workout_sessions = 1
        
        print(f"✅ Loaded {total_exercises} exercise records from {workout_sessions} workout sessions")
        
        if self.metrics:
            freq_analysis = self.metrics.calculate_frequency_analysis()
            print(f"📅 {freq_analysis.get('date_range', 'Date range unavailable')}")
            
            type_balance = self.metrics.calculate_workout_type_balance()
            print(f"🏋️ Workout types: {', '.join(f'{k}: {v}' for k, v in type_balance.items())}")
    
    def _print_nutrition_loading_summary(self):
        if isinstance(self.nutrition_data, list):
            total_foods = sum(len(n.get('foods', [])) for n in self.nutrition_data)
            nutrition_days = len(self.nutrition_data)
        else:
            total_foods = len(self.nutrition_data.get('foods', []))
            nutrition_days = 1
        
        print(f"✅ Loaded {total_foods} food records from {nutrition_days} nutrition days")
        
        if self.nutrition_data:
            weekly_avg = self.nutrition_analyzer.get_weekly_averages()
            if weekly_avg:
                print(f"🔥 Weekly avg: {weekly_avg['avg_calories']} kcal, {weekly_avg['avg_protein']}g protein")
    
    def _print_sleep_loading_summary(self):
        if isinstance(self.sleep_data, list):
            sleep_days = len(self.sleep_data)
        else:
            sleep_days = 1
        
        print(f"✅ Loaded sleep data from {sleep_days} days")
        
        if self.sleep_data:
            weekly_avg = self.sleep_analyzer.get_weekly_averages()
            if weekly_avg:
                print(f"😴 Weekly avg: {weekly_avg['avg_sleep_hours']} hours, quality: {weekly_avg['avg_sleep_quality']}/10")
    
    def _print_stress_loading_summary(self):
        if isinstance(self.stress_data, list):
            stress_days = len(self.stress_data)
        else:
            stress_days = 1
        
        print(f"✅ Loaded stress data from {stress_days} days")
        
        if self.stress_data:
            weekly_avg = self.stress_analyzer.get_weekly_averages()
            if weekly_avg:
                print(f"😰 Weekly avg stress: {weekly_avg['avg_stress_level']}/10")
    
    def _print_hydration_loading_summary(self):
        if isinstance(self.hydration_data, list):
            hydration_days = len(self.hydration_data)
        else:
            hydration_days = 1
        
        print(f"✅ Loaded hydration data from {hydration_days} days")
        
        if self.hydration_data:
            weekly_avg = self.hydration_analyzer.get_weekly_averages()
            if weekly_avg:
                print(f"💧 Weekly avg: {weekly_avg['avg_water_intake']} liters, quality: {weekly_avg['avg_hydration_quality']}/10")

def main():
    print("🏋️ Gym Application")
    print("=" * 50)
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Please set OPENAI_API_KEY environment variable")
        sys.exit(1)
    
    app = GymApp(api_key)
    
    # Load workout data
    workout_file = "3_week_pplpp_schedule.json"
    if not app.load_workout_data(workout_file):
        print("❌ Failed to load workout data")
        sys.exit(1)
    
    # Load nutrition data
    nutrition_file = "vegetarian_15_day_nutrition.json"
    if not app.load_nutrition_data(nutrition_file):
        print("⚠️ Failed to load nutrition data, continuing with workout analysis only")
    else:
        print("✅ Nutrition data loaded!")
    
    # Load sleep data
    sleep_file = "sleep_data_15_days.json"
    if not app.load_sleep_data(sleep_file):
        print("⚠️ Failed to load sleep data, continuing without sleep analysis")
    else:
        print("✅ Sleep data loaded!")
    
    # Load stress data
    stress_file = "stress_data_15_days.json"
    if not app.load_stress_data(stress_file):
        print("⚠️ Failed to load stress data, continuing without stress analysis")
    else:
        print("✅ Stress data loaded!")
    
    # Load hydration data
    hydration_file = "hydration_data_15_days.json"
    if not app.load_hydration_data(hydration_file):
        print("⚠️ Failed to load hydration data, continuing without hydration analysis")
    else:
        print("✅ Hydration data loaded!")
    
    print("\n🤖 Getting AI analysis...")
    analysis = app.analyze_workouts()
    print("\n" + "="*60)
    print("📊 WORKOUT ANALYSIS RESULTS")
    print("="*60)
    print(analysis)
    
    # Show comprehensive analysis
    if app.workout_data and (app.nutrition_data or app.sleep_data or app.stress_data or app.hydration_data):
        print("\n" + "="*60)
        print("🔄 COMPREHENSIVE FITNESS ANALYSIS")
        print("="*60)
        comprehensive_analysis = app.get_comprehensive_analysis()
        print(comprehensive_analysis)
    
    print("\n" + "="*60)
    print("🔮 NEXT WORKOUT PREDICTIONS")
    print("="*60)
    predictions = app.get_predictions()
    print(predictions)

if __name__ == "__main__":
    main() 