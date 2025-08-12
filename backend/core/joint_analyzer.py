from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .nutrition_analyzer import NutritionAnalyzer

class JointAnalyzer:
    def __init__(self, workout_analyzer, nutrition_analyzer: NutritionAnalyzer):
        self.workout_analyzer = workout_analyzer
        self.nutrition_analyzer = nutrition_analyzer
    
    def get_daily_analysis(self, date: str) -> Dict:
        """Get comprehensive daily analysis combining workout and nutrition."""
        workout_data = self._get_workout_by_date(date)
        nutrition_data = self.nutrition_analyzer.get_daily_macros(date)
        
        analysis = {
            'date': date,
            'workout': workout_data,
            'nutrition': nutrition_data,
            'recovery_analysis': {},
            'performance_correlation': {},
            'recommendations': []
        }
        
        # Analyze recovery and performance correlation
        if workout_data and nutrition_data:
            analysis['recovery_analysis'] = self._analyze_recovery(workout_data, nutrition_data)
            analysis['performance_correlation'] = self._analyze_performance_correlation(workout_data, nutrition_data)
            analysis['recommendations'] = self._generate_recommendations(workout_data, nutrition_data)
        
        return analysis
    
    def get_weekly_joint_analysis(self) -> Dict:
        """Get weekly analysis combining workout and nutrition trends."""
        workout_trends = self._get_workout_trends()
        nutrition_trends = self.nutrition_analyzer.get_macro_trends(7)
        
        analysis = {
            'workout_trends': workout_trends,
            'nutrition_trends': nutrition_trends,
            'correlation_insights': self._analyze_weekly_correlation(workout_trends, nutrition_trends),
            'weekly_recommendations': self._generate_weekly_recommendations(workout_trends, nutrition_trends)
        }
        
        return analysis
    
    def _get_workout_by_date(self, date: str) -> Optional[Dict]:
        """Get workout data for a specific date."""
        if not self.workout_analyzer.workout_data:
            return None
        
        workouts = self.workout_analyzer.workout_data if isinstance(self.workout_analyzer.workout_data, list) else [self.workout_analyzer.workout_data]
        
        for workout in workouts:
            if workout.get('date') == date:
                return workout
        
        return None
    
    def _get_workout_trends(self) -> Dict:
        """Get workout trends over the last 7 days."""
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
            
            # Calculate total volume (weight * reps * sets)
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
    
    def _analyze_recovery(self, workout: Dict, nutrition: Dict) -> Dict:
        """Analyze recovery based on workout intensity and nutrition."""
        if not workout or not nutrition:
            return {}
        
        # Calculate workout intensity
        exercises = workout.get('exercises', [])
        total_volume = 0
        for exercise in exercises:
            weight = exercise.get('weight', 0)
            for set_data in exercise.get('sets', []):
                reps = set_data.get('reps', 0)
                total_volume += weight * reps
        
        # Analyze nutrition adequacy for recovery
        protein_adequacy = "adequate" if nutrition.get('protein', 0) >= 120 else "insufficient"
        carb_adequacy = "adequate" if nutrition.get('carbs', 0) >= 200 else "insufficient"
        calorie_adequacy = "adequate" if nutrition.get('calories', 0) >= 2000 else "insufficient"
        
        recovery_score = 0
        if protein_adequacy == "adequate": recovery_score += 1
        if carb_adequacy == "adequate": recovery_score += 1
        if calorie_adequacy == "adequate": recovery_score += 1
        
        return {
            'workout_intensity': 'high' if total_volume > 10000 else 'moderate' if total_volume > 5000 else 'low',
            'total_volume': total_volume,
            'protein_adequacy': protein_adequacy,
            'carb_adequacy': carb_adequacy,
            'calorie_adequacy': calorie_adequacy,
            'recovery_score': recovery_score,
            'recovery_quality': 'excellent' if recovery_score == 3 else 'good' if recovery_score == 2 else 'poor'
        }
    
    def _analyze_performance_correlation(self, workout: Dict, nutrition: Dict) -> Dict:
        """Analyze correlation between nutrition and workout performance."""
        if not workout or not nutrition:
            return {}
        
        exercises = workout.get('exercises', [])
        performance_metrics = {
            'total_sets': sum(len(ex.get('sets', [])) for ex in exercises),
            'total_reps': sum(sum(s.get('reps', 0) for s in ex.get('sets', [])) for ex in exercises),
            'avg_weight': sum(ex.get('weight', 0) for ex in exercises) / len(exercises) if exercises else 0
        }
        
        nutrition_metrics = {
            'protein_per_kg': nutrition.get('protein', 0) / 70,  # Assuming 70kg bodyweight
            'carbs_per_kg': nutrition.get('carbs', 0) / 70,
            'calorie_density': nutrition.get('calories', 0) / max(len(nutrition.get('foods', [])), 1)
        }
        
        return {
            'performance_metrics': performance_metrics,
            'nutrition_metrics': nutrition_metrics,
            'correlation_insights': self._generate_correlation_insights(performance_metrics, nutrition_metrics)
        }
    
    def _generate_correlation_insights(self, performance: Dict, nutrition: Dict) -> List[str]:
        """Generate insights about nutrition-performance correlation."""
        insights = []
        
        if nutrition['protein_per_kg'] >= 1.6:
            insights.append("High protein intake supports muscle recovery and strength gains")
        elif nutrition['protein_per_kg'] < 1.2:
            insights.append("Protein intake may be insufficient for optimal muscle recovery")
        
        if nutrition['carbs_per_kg'] >= 3:
            insights.append("Adequate carb intake supports workout performance and recovery")
        elif nutrition['carbs_per_kg'] < 2:
            insights.append("Low carb intake may limit workout performance and recovery")
        
        return insights
    
    def _analyze_weekly_correlation(self, workout_trends: Dict, nutrition_trends: Dict) -> Dict:
        """Analyze weekly correlation between workout and nutrition trends."""
        if not workout_trends or not nutrition_trends:
            return {}
        
        insights = []
        
        # Check if workout volume correlates with nutrition
        if len(workout_trends['total_volume']) >= 2 and len(nutrition_trends['calories']) >= 2:
            avg_volume = sum(workout_trends['total_volume']) / len(workout_trends['total_volume'])
            avg_calories = sum(nutrition_trends['calories']) / len(nutrition_trends['calories'])
            
            if avg_volume > 8000 and avg_calories < 2500:
                insights.append("High workout volume with low calorie intake may lead to overtraining")
            elif avg_volume < 4000 and avg_calories > 3000:
                insights.append("Low workout volume with high calorie intake may lead to weight gain")
        
        return {
            'insights': insights,
            'workout_volume_trend': 'increasing' if len(workout_trends['total_volume']) >= 2 and workout_trends['total_volume'][-1] > workout_trends['total_volume'][-2] else 'stable' if len(workout_trends['total_volume']) >= 2 and workout_trends['total_volume'][-1] == workout_trends['total_volume'][-2] else 'decreasing',
            'nutrition_trend': 'increasing' if len(nutrition_trends['calories']) >= 2 and nutrition_trends['calories'][-1] > nutrition_trends['calories'][-2] else 'stable' if len(nutrition_trends['calories']) >= 2 and nutrition_trends['calories'][-1] == nutrition_trends['calories'][-2] else 'decreasing'
        }
    
    def _generate_recommendations(self, workout: Dict, nutrition: Dict) -> List[str]:
        """Generate personalized recommendations based on workout and nutrition data."""
        recommendations = []
        
        if not workout or not nutrition:
            return recommendations
        
        recovery = self._analyze_recovery(workout, nutrition)
        
        if recovery.get('recovery_quality') == 'poor':
            recommendations.append("Increase protein intake to at least 120g daily for better recovery")
            recommendations.append("Consider increasing daily calories to support workout demands")
        
        if recovery.get('workout_intensity') == 'high' and nutrition.get('carbs', 0) < 250:
            recommendations.append("Increase carb intake on high-intensity workout days")
        
        if nutrition.get('protein', 0) < 100:
            recommendations.append("Aim for at least 100g protein daily for muscle maintenance")
        
        return recommendations
    
    def _generate_weekly_recommendations(self, workout_trends: Dict, nutrition_trends: Dict) -> List[str]:
        """Generate weekly recommendations based on trends."""
        recommendations = []
        
        correlation = self._analyze_weekly_correlation(workout_trends, nutrition_trends)
        
        if correlation.get('workout_volume_trend') == 'increasing':
            recommendations.append("Gradually increase nutrition to support increasing workout volume")
        
        if correlation.get('nutrition_trend') == 'decreasing' and correlation.get('workout_volume_trend') == 'stable':
            recommendations.append("Maintain consistent nutrition to support workout performance")
        
        return recommendations
    
    def get_joint_summary(self) -> str:
        """Get a comprehensive summary combining workout and nutrition analysis."""
        if not self.workout_analyzer.workout_data:
            return "❌ No workout data loaded"
        
        if not self.nutrition_analyzer.nutrition_data:
            return "❌ No nutrition data loaded"
        
        summary = "🔄 JOINT WORKOUT & NUTRITION ANALYSIS\n"
        summary += "=" * 50 + "\n\n"
        
        # Add nutrition summary
        summary += self.nutrition_analyzer.get_nutrition_summary() + "\n\n"
        
        # Add weekly joint analysis
        weekly_analysis = self.get_weekly_joint_analysis()
        
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