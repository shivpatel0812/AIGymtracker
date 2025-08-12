from typing import Dict, List, Any
from datetime import datetime, timedelta

class WorkoutMetrics:
    def __init__(self, workout_data: List[Dict]):
        self.workout_data = workout_data
    
    def calculate_volume_progression(self) -> Dict[str, List[Dict]]:
        volume_data = {}
        
        for workout in self.workout_data:
            date = workout.get('date')
            for exercise in workout.get('exercises', []):
                name = exercise.get('name')
                weight = exercise.get('weight', 0)
                total_reps = sum(s.get('reps', 0) for s in exercise.get('sets', []))
                volume = weight * total_reps
                
                if name not in volume_data:
                    volume_data[name] = []
                
                volume_data[name].append({
                    'date': date,
                    'volume': volume,
                    'weight': weight,
                    'total_reps': total_reps
                })
        
        return volume_data
    
    def calculate_frequency_analysis(self) -> Dict[str, Any]:
        dates = [datetime.strptime(w.get('date'), '%Y-%m-%d') for w in self.workout_data if w.get('date')]
        dates.sort()
        
        if len(dates) < 2:
            return {'avg_days_between': 0, 'total_sessions': len(dates)}
        
        gaps = []
        for i in range(1, len(dates)):
            gap = (dates[i] - dates[i-1]).days
            gaps.append(gap)
        
        return {
            'avg_days_between': sum(gaps) / len(gaps),
            'total_sessions': len(dates),
            'date_range': f"{dates[0].strftime('%Y-%m-%d')} to {dates[-1].strftime('%Y-%m-%d')}"
        }
    
    def calculate_workout_type_balance(self) -> Dict[str, int]:
        type_counts = {}
        for workout in self.workout_data:
            workout_type = workout.get('workout_type', 'Unknown')
            type_counts[workout_type] = type_counts.get(workout_type, 0) + 1
        return type_counts
    
    def calculate_exercise_progression(self) -> Dict[str, Dict[str, Any]]:
        progression = {}
        
        for workout in self.workout_data:
            date = workout.get('date')
            for exercise in workout.get('exercises', []):
                name = exercise.get('name')
                weight = exercise.get('weight', 0)
                max_reps = max((s.get('reps', 0) for s in exercise.get('sets', [])), default=0)
                
                if name not in progression:
                    progression[name] = {
                        'sessions': 0,
                        'weight_progression': [],
                        'rep_progression': [],
                        'first_session': None,
                        'latest_session': None
                    }
                
                progression[name]['sessions'] += 1
                progression[name]['weight_progression'].append({'date': date, 'weight': weight})
                progression[name]['rep_progression'].append({'date': date, 'max_reps': max_reps})
                
                if progression[name]['first_session'] is None:
                    progression[name]['first_session'] = {'date': date, 'weight': weight, 'reps': max_reps}
                
                progression[name]['latest_session'] = {'date': date, 'weight': weight, 'reps': max_reps}
        
        return progression
    
    def calculate_fatigue_patterns(self) -> Dict[str, List[Dict]]:
        fatigue_data = {}
        
        for workout in self.workout_data:
            for exercise in workout.get('exercises', []):
                name = exercise.get('name')
                sets = exercise.get('sets', [])
                
                if len(sets) < 2:
                    continue
                
                if name not in fatigue_data:
                    fatigue_data[name] = []
                
                set_reps = [s.get('reps', 0) for s in sets]
                if len(set_reps) >= 2:
                    fatigue_drop = set_reps[0] - set_reps[-1]
                    fatigue_data[name].append({
                        'date': workout.get('date'),
                        'fatigue_drop': fatigue_drop,
                        'set_reps': set_reps
                    })
        
        return fatigue_data 