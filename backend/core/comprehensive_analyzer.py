from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .nutrition_analyzer import NutritionAnalyzer
from .sleep_analyzer import SleepAnalyzer
from .stress_analyzer import StressAnalyzer
from .hydration_analyzer import HydrationAnalyzer

class ComprehensiveAnalyzer:
    def __init__(self, workout_analyzer, nutrition_analyzer: NutritionAnalyzer, sleep_analyzer: SleepAnalyzer, stress_analyzer: StressAnalyzer, hydration_analyzer: HydrationAnalyzer):
        self.workout_analyzer = workout_analyzer
        self.nutrition_analyzer = nutrition_analyzer
        self.sleep_analyzer = sleep_analyzer
        self.stress_analyzer = stress_analyzer
        self.hydration_analyzer = hydration_analyzer
    
    def get_daily_comprehensive_analysis(self, date: str) -> Dict:
        workout_data = self._get_workout_by_date(date)
        nutrition_data = self.nutrition_analyzer.get_daily_macros(date)
        sleep_data = self.sleep_analyzer.get_daily_sleep(date)
        stress_data = self.stress_analyzer.get_daily_stress(date)
        hydration_data = self.hydration_analyzer.get_daily_hydration(date)
        
        analysis = {
            'date': date,
            'workout': workout_data,
            'nutrition': nutrition_data,
            'sleep': sleep_data,
            'stress': stress_data,
            'hydration': hydration_data,
            'recovery_score': 0,
            'performance_factors': [],
            'recommendations': []
        }
        
        if workout_data and nutrition_data and sleep_data and stress_data and hydration_data:
            analysis['recovery_score'] = self._calculate_recovery_score(nutrition_data, sleep_data, stress_data, hydration_data)
            analysis['performance_factors'] = self._analyze_performance_factors(workout_data, nutrition_data, sleep_data, stress_data, hydration_data)
            analysis['recommendations'] = self._generate_comprehensive_recommendations(workout_data, nutrition_data, sleep_data, stress_data, hydration_data)
        
        return analysis
    
    def get_weekly_comprehensive_analysis(self) -> Dict:
        workout_trends = self._get_workout_trends()
        nutrition_trends = self.nutrition_analyzer.get_macro_trends(7)
        sleep_trends = self.sleep_analyzer.get_sleep_trends(7)
        stress_trends = self.stress_analyzer.get_stress_trends(7)
        hydration_trends = self.hydration_analyzer.get_hydration_trends(7)
        
        analysis = {
            'workout_trends': workout_trends,
            'nutrition_trends': nutrition_trends,
            'sleep_trends': sleep_trends,
            'stress_trends': stress_trends,
            'hydration_trends': hydration_trends,
            'correlation_insights': self._analyze_weekly_correlations(workout_trends, nutrition_trends, sleep_trends, stress_trends, hydration_trends),
            'weekly_recommendations': self._generate_weekly_recommendations(workout_trends, nutrition_trends, sleep_trends, stress_trends, hydration_trends)
        }
        
        return analysis
    
    def _get_workout_by_date(self, date: str) -> Optional[Dict]:
        if not self.workout_analyzer.workout_data:
            return None
        
        workouts = self.workout_analyzer.workout_data if isinstance(self.workout_analyzer.workout_data, list) else [self.workout_analyzer.workout_data]
        
        for workout in workouts:
            if workout.get('date') == date:
                return workout
        
        return None
    
    def _get_workout_trends(self) -> Dict:
        if not self.workout_analyzer.workout_data:
            return {}
        
        workouts = self.workout_analyzer.workout_data if isinstance(self.workout_analyzer.workout_data, list) else [self.workout_analyzer.workout_data]
        
        trends = {
            'dates': [],
            'workout_types': [],
            'total_volume': [],
            'exercise_count': []
        }
        
        for workout in workouts[-7:]:
            date = workout.get('date')
            workout_type = workout.get('workout_type', 'Unknown')
            exercises = workout.get('exercises', [])
            
            total_volume = 0
            for exercise in exercises:
                weight = exercise.get('weight', 0)
                for set_data in exercise.get('sets', []):
                    reps = set_data.get('reps', 0)
                    total_volume += weight * reps
            
            trends['dates'].append(date)
            trends['workout_types'].append(workout_type)
            trends['total_volume'].append(total_volume)
            trends['exercise_count'].append(len(exercises))
        
        return trends
    
    def _calculate_recovery_score(self, nutrition: Dict, sleep: Dict, stress: Dict, hydration: Dict) -> int:
        score = 0
        
        if nutrition.get('protein', 0) >= 120:
            score += 1
        if nutrition.get('calories', 0) >= 2000:
            score += 1
        if sleep.get('sleep_hours', 0) >= 7:
            score += 1
        if sleep.get('sleep_quality', 0) >= 7:
            score += 1
        if stress.get('stress_level', 10) <= 5:
            score += 1
        if hydration.get('water_intake', 0) >= 2.5:
            score += 1
        if hydration.get('hydration_quality', 0) >= 7:
            score += 1
        
        return score
    
    def _analyze_performance_factors(self, workout: Dict, nutrition: Dict, sleep: Dict, stress: Dict, hydration: Dict) -> List[str]:
        factors = []
        
        if nutrition.get('protein', 0) < 100:
            factors.append("Low protein intake limiting recovery")
        if sleep.get('sleep_hours', 0) < 7:
            factors.append("Insufficient sleep affecting performance")
        if sleep.get('sleep_quality', 0) < 6:
            factors.append("Poor sleep quality impacting recovery")
        if stress.get('stress_level', 0) > 7:
            factors.append("High stress levels affecting workout performance")
        if hydration.get('water_intake', 0) < 2.0:
            factors.append("Low water intake affecting performance and recovery")
        if hydration.get('hydration_quality', 0) < 6:
            factors.append("Poor hydration quality impacting workout performance")
        
        return factors
    
    def _generate_comprehensive_recommendations(self, workout: Dict, nutrition: Dict, sleep: Dict, stress: Dict, hydration: Dict) -> List[str]:
        recommendations = []
        
        if nutrition.get('protein', 0) < 120:
            recommendations.append("Increase protein intake to 120g+ daily")
        if sleep.get('sleep_hours', 0) < 7:
            recommendations.append("Aim for 7-9 hours of sleep nightly")
        if sleep.get('sleep_quality', 0) < 6:
            recommendations.append("Improve sleep hygiene and environment")
        if stress.get('stress_level', 0) > 7:
            recommendations.append("Implement stress management techniques")
        if hydration.get('water_intake', 0) < 2.5:
            recommendations.append("Increase water intake to 2.5+ liters daily")
        if hydration.get('hydration_quality', 0) < 6:
            recommendations.append("Improve hydration quality and timing")
        
        return recommendations
    
    def _analyze_weekly_correlations(self, workout_trends: Dict, nutrition_trends: Dict, sleep_trends: Dict, stress_trends: Dict, hydration_trends: Dict) -> Dict:
        insights = []
        
        if len(workout_trends['total_volume']) >= 2 and len(sleep_trends['sleep_hours']) >= 2:
            avg_volume = sum(workout_trends['total_volume']) / len(workout_trends['total_volume'])
            avg_sleep = sum(sleep_trends['sleep_hours']) / len(sleep_trends['sleep_hours'])
            
            if avg_volume > 8000 and avg_sleep < 6.5:
                insights.append("High workout volume with low sleep may lead to overtraining")
        
        if len(stress_trends['stress_levels']) >= 2:
            avg_stress = sum(stress_trends['stress_levels']) / len(stress_trends['stress_levels'])
            if avg_stress > 7:
                insights.append("High stress levels may be affecting workout performance and recovery")
        
        if len(hydration_trends['water_intake']) >= 2:
            avg_hydration = sum(hydration_trends['water_intake']) / len(hydration_trends['water_intake'])
            if avg_hydration < 2.0:
                insights.append("Low hydration levels may be limiting workout performance and recovery")
        
        return {'insights': insights}
    
    def _generate_weekly_recommendations(self, workout_trends: Dict, nutrition_trends: Dict, sleep_trends: Dict, stress_trends: Dict, hydration_trends: Dict) -> List[str]:
        recommendations = []
        
        if len(workout_trends['total_volume']) >= 2 and workout_trends['total_volume'][-1] > workout_trends['total_volume'][-2]:
            recommendations.append("Increase recovery focus as workout volume increases")
        
        if len(sleep_trends['sleep_hours']) >= 2 and sleep_trends['sleep_hours'][-1] < 7:
            recommendations.append("Prioritize sleep to support workout performance")
        
        if len(hydration_trends['water_intake']) >= 2 and hydration_trends['water_intake'][-1] < 2.5:
            recommendations.append("Maintain consistent hydration to support workout performance")
        
        return recommendations
    
    def get_comprehensive_summary(self) -> str:
        if not self.workout_analyzer.workout_data:
            return "❌ No workout data loaded"
        
        summary = "🔄 COMPREHENSIVE FITNESS ANALYSIS\n"
        summary += "=" * 50 + "\n\n"
        
        if self.nutrition_analyzer.nutrition_data:
            summary += self.nutrition_analyzer.get_nutrition_summary() + "\n\n"
        
        if self.sleep_analyzer.sleep_data:
            summary += self.sleep_analyzer.get_sleep_summary() + "\n\n"
        
        if self.stress_analyzer.stress_data:
            summary += self.stress_analyzer.get_stress_summary() + "\n\n"
        
        if self.hydration_analyzer.hydration_data:
            summary += self.hydration_analyzer.get_hydration_summary() + "\n\n"
        
        weekly_analysis = self.get_weekly_comprehensive_analysis()
        
        if weekly_analysis.get('correlation_insights', {}).get('insights'):
            summary += "🔗 WEEKLY CORRELATION INSIGHTS:\n"
            for insight in weekly_analysis['correlation_insights']['insights']:
                summary += f"• {insight}\n"
            summary += "\n"
        
        if weekly_analysis.get('weekly_recommendations'):
            summary += "💡 WEEKLY RECOMMENDATIONS:\n"
            for rec in weekly_analysis['weekly_recommendations']:
                summary += f"• {rec}\n"
        
        return summary 