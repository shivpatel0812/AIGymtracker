from typing import Dict, List, Optional
from datetime import datetime, timedelta

class HydrationAnalyzer:
    def __init__(self):
        self.hydration_data = None
    
    def load_hydration_data(self, data):
        self.hydration_data = data
    
    def get_daily_hydration(self, date: str) -> Dict:
        if not self.hydration_data:
            return {}
        
        hydration_entries = self.hydration_data if isinstance(self.hydration_data, list) else [self.hydration_data]
        
        for entry in hydration_entries:
            if entry.get('date') == date:
                return entry
        
        return {}
    
    def get_hydration_trends(self, days: int = 7) -> Dict:
        if not self.hydration_data:
            return {}
        
        trends = {
            'dates': [],
            'water_intake': [],
            'hydration_quality': []
        }
        
        hydration_entries = self.hydration_data if isinstance(self.hydration_data, list) else [self.hydration_data]
        
        for entry in hydration_entries[-days:]:
            trends['dates'].append(entry.get('date'))
            trends['water_intake'].append(entry.get('water_intake', 0))
            trends['hydration_quality'].append(entry.get('hydration_quality', 0))
        
        return trends
    
    def get_weekly_averages(self) -> Dict:
        trends = self.get_hydration_trends(7)
        if not trends['dates']:
            return {}
        
        return {
            'avg_water_intake': round(sum(trends['water_intake']) / len(trends['water_intake']), 1),
            'avg_hydration_quality': round(sum(trends['hydration_quality']) / len(trends['hydration_quality']), 1)
        }
    
    def get_hydration_summary(self) -> str:
        if not self.hydration_data:
            return "❌ No hydration data loaded"
        
        weekly_avg = self.get_weekly_averages()
        if not weekly_avg:
            return "❌ No weekly data available"
        
        summary = "💧 HYDRATION SUMMARY (7-day average):\n"
        summary += f"🚰 Water Intake: {weekly_avg['avg_water_intake']} liters\n"
        summary += f"⭐ Hydration Quality: {weekly_avg['avg_hydration_quality']}/10\n"
        
        return summary 