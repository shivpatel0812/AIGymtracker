from typing import Dict, List, Optional
from datetime import datetime, timedelta

class SleepAnalyzer:
    def __init__(self):
        self.sleep_data = None
    
    def load_sleep_data(self, data):
        self.sleep_data = data
    
    def get_daily_sleep(self, date: str) -> Dict:
        if not self.sleep_data:
            return {}
        
        sleep_entries = self.sleep_data if isinstance(self.sleep_data, list) else [self.sleep_data]
        
        for entry in sleep_entries:
            if entry.get('date') == date:
                return entry
        
        return {}
    
    def get_sleep_trends(self, days: int = 7) -> Dict:
        if not self.sleep_data:
            return {}
        
        trends = {
            'dates': [],
            'sleep_hours': [],
            'sleep_quality': []
        }
        
        sleep_entries = self.sleep_data if isinstance(self.sleep_data, list) else [self.sleep_data]
        
        for entry in sleep_entries[-days:]:
            trends['dates'].append(entry.get('date'))
            trends['sleep_hours'].append(entry.get('sleep_hours', 0))
            trends['sleep_quality'].append(entry.get('sleep_quality', 0))
        
        return trends
    
    def get_weekly_averages(self) -> Dict:
        trends = self.get_sleep_trends(7)
        if not trends['dates']:
            return {}
        
        return {
            'avg_sleep_hours': round(sum(trends['sleep_hours']) / len(trends['sleep_hours']), 1),
            'avg_sleep_quality': round(sum(trends['sleep_quality']) / len(trends['sleep_quality']), 1)
        }
    
    def get_sleep_summary(self) -> str:
        if not self.sleep_data:
            return "❌ No sleep data loaded"
        
        weekly_avg = self.get_weekly_averages()
        if not weekly_avg:
            return "❌ No weekly data available"
        
        summary = "😴 SLEEP SUMMARY (7-day average):\n"
        summary += f"⏰ Sleep Hours: {weekly_avg['avg_sleep_hours']} hours\n"
        summary += f"⭐ Sleep Quality: {weekly_avg['avg_sleep_quality']}/10\n"
        
        return summary 