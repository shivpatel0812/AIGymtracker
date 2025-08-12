from typing import Dict, List, Optional
from datetime import datetime, timedelta

class StressAnalyzer:
    def __init__(self):
        self.stress_data = None
    
    def load_stress_data(self, data):
        self.stress_data = data
    
    def get_daily_stress(self, date: str) -> Dict:
        if not self.stress_data:
            return {}
        
        stress_entries = self.stress_data if isinstance(self.stress_data, list) else [self.stress_data]
        
        for entry in stress_entries:
            if entry.get('date') == date:
                return entry
        
        return {}
    
    def get_stress_trends(self, days: int = 7) -> Dict:
        if not self.stress_data:
            return {}
        
        trends = {
            'dates': [],
            'stress_levels': [],
            'stress_factors': []
        }
        
        stress_entries = self.stress_data if isinstance(self.stress_data, list) else [self.stress_data]
        
        for entry in stress_entries[-days:]:
            trends['dates'].append(entry.get('date'))
            trends['stress_levels'].append(entry.get('stress_level', 0))
            trends['stress_factors'].append(entry.get('stress_factors', ''))
        
        return trends
    
    def get_weekly_averages(self) -> Dict:
        trends = self.get_stress_trends(7)
        if not trends['dates']:
            return {}
        
        return {
            'avg_stress_level': round(sum(trends['stress_levels']) / len(trends['stress_levels']), 1)
        }
    
    def get_stress_summary(self) -> str:
        if not self.stress_data:
            return "❌ No stress data loaded"
        
        weekly_avg = self.get_weekly_averages()
        if not weekly_avg:
            return "❌ No weekly data available"
        
        summary = "😰 STRESS SUMMARY (7-day average):\n"
        summary += f"📊 Stress Level: {weekly_avg['avg_stress_level']}/10\n"
        
        return summary 