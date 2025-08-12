from typing import Dict, List, Optional
from datetime import datetime, timedelta

class NutritionAnalyzer:
    def __init__(self):
        self.nutrition_data = None
    
    def load_nutrition_data(self, data):
        self.nutrition_data = data
    
    def get_daily_macros(self, date: str) -> Dict:
        """Get macro totals for a specific date."""
        if not self.nutrition_data:
            return {}
        
        daily_foods = self._get_foods_by_date(date)
        if not daily_foods:
            return {}
        
        total_calories = sum(food.get('calories', 0) for food in daily_foods)
        total_protein = sum(food.get('protein', 0) for food in daily_foods)
        total_carbs = sum(food.get('carbs', 0) for food in daily_foods)
        total_fat = sum(food.get('fat', 0) for food in daily_foods)
        
        return {
            'date': date,
            'calories': total_calories,
            'protein': total_protein,
            'carbs': total_carbs,
            'fat': total_fat,
            'foods': daily_foods
        }
    
    def get_macro_trends(self, days: int = 7) -> Dict:
        """Get macro trends over the last N days."""
        if not self.nutrition_data:
            return {}
        
        trends = {
            'calories': [],
            'protein': [],
            'carbs': [],
            'fat': [],
            'dates': []
        }
        
        nutrition_entries = self.nutrition_data if isinstance(self.nutrition_data, list) else [self.nutrition_data]
        
        for entry in nutrition_entries[-days:]:
            date = entry.get('date')
            daily_macros = self.get_daily_macros(date)
            
            if daily_macros:
                trends['dates'].append(date)
                trends['calories'].append(daily_macros['calories'])
                trends['protein'].append(daily_macros['protein'])
                trends['carbs'].append(daily_macros['carbs'])
                trends['fat'].append(daily_macros['fat'])
        
        return trends
    
    def get_macro_balance(self, date: str) -> Dict:
        """Get macro balance percentages for a specific date."""
        daily_macros = self.get_daily_macros(date)
        if not daily_macros or daily_macros['calories'] == 0:
            return {}
        
        protein_cals = daily_macros['protein'] * 4
        carbs_cals = daily_macros['carbs'] * 4
        fat_cals = daily_macros['fat'] * 9
        
        total_cals = daily_macros['calories']
        
        return {
            'date': date,
            'protein_pct': round((protein_cals / total_cals) * 100, 1),
            'carbs_pct': round((carbs_cals / total_cals) * 100, 1),
            'fat_pct': round((fat_cals / total_cals) * 100, 1)
        }
    
    def get_weekly_averages(self) -> Dict:
        """Get weekly macro averages."""
        trends = self.get_macro_trends(7)
        if not trends['dates']:
            return {}
        
        return {
            'avg_calories': round(sum(trends['calories']) / len(trends['calories']), 0),
            'avg_protein': round(sum(trends['protein']) / len(trends['protein']), 1),
            'avg_carbs': round(sum(trends['carbs']) / len(trends['carbs']), 1),
            'avg_fat': round(sum(trends['fat']) / len(trends['fat']), 1)
        }
    
    def _get_foods_by_date(self, date: str) -> List[Dict]:
        """Get all foods consumed on a specific date."""
        if not self.nutrition_data:
            return []
        
        nutrition_entries = self.nutrition_data if isinstance(self.nutrition_data, list) else [self.nutrition_data]
        
        for entry in nutrition_entries:
            if entry.get('date') == date:
                return entry.get('foods', [])
        
        return []
    
    def get_nutrition_summary(self) -> str:
        """Get a formatted nutrition summary."""
        if not self.nutrition_data:
            return "❌ No nutrition data loaded"
        
        weekly_avg = self.get_weekly_averages()
        if not weekly_avg:
            return "❌ No weekly data available"
        
        summary = "📊 NUTRITION SUMMARY (7-day average):\n"
        summary += f"🔥 Calories: {weekly_avg['avg_calories']} kcal\n"
        summary += f"🥩 Protein: {weekly_avg['avg_protein']}g\n"
        summary += f"🍞 Carbs: {weekly_avg['avg_carbs']}g\n"
        summary += f"🥑 Fat: {weekly_avg['avg_fat']}g\n"
        
        return summary 