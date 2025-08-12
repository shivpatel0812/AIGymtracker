import json
from openai import OpenAI
from typing import Dict, List, Optional

class WorkoutAnalyzer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.workout_data = None
        self.user_profile = {}
    
    def set_user_profile(self, **kwargs):
        self.user_profile.update(kwargs)
        print(f"👤 Profile updated: {self.user_profile}")
    
    def analyze_workouts(self, focus_areas=None, nutrition_context=None, sleep_context=None, stress_context=None, hydration_context=None):
        if self.workout_data is None:
            return "❌ No workout data loaded. Please use load_data() first."
        
        data_summary = self._prepare_workout_data()
        prompt = self._create_analysis_prompt(data_summary, focus_areas, nutrition_context, sleep_context, stress_context, hydration_context)
        
        print("🤖 Analyzing your workouts with OpenAI...")
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system", 
                        "content": """You are an expert fitness coach and exercise scientist with 15+ years of experience. 
                        You specialize in analyzing detailed workout data including set-by-set performance and workout type programming.
                        Always be specific with numbers, weights, and rep ranges. Focus on actionable advice and analyze 
                        set-by-set performance patterns, fatigue patterns, and workout type balance (Push/Pull/Legs)."""
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=3000,
                temperature=0.3
            )
            
            analysis = response.choices[0].message.content
            print("✅ Analysis complete!")
            return analysis
        except Exception as e:
            return f"❌ Error calling OpenAI API: {e}\nMake sure your API key is valid and you have credits."
    
    def get_next_workout_predictions(self):
        if self.workout_data is None:
            return "❌ No workout data loaded."
        
        recent_data = self._get_detailed_progress()
        
        prompt = f"""
        USER PROFILE: {json.dumps(self.user_profile, indent=2)}
        
        DETAILED WORKOUT PROGRESS:
        {recent_data}
        
        Based on this detailed set-by-set data, provide SPECIFIC predictions for the next workout session:
        
        1. For each exercise, predict the exact weight and target reps for each set
        2. Account for fatigue patterns (how reps typically drop across sets)
        3. Suggest workout type (Push/Pull/Legs) for next session based on recovery
        4. Provide progressive overload strategy (weight vs reps vs sets)
        
        Format as:
        NEXT WORKOUT TYPE: [Push/Pull/Legs]
        
        EXERCISE NAME:
        - Set 1: XXkg x XX reps (target)
        - Set 2: XXkg x XX reps (expected fatigue)
        - Set 3: XXkg x XX reps (expected fatigue)
        - Reasoning: [why this progression]
        - Alternative: [if too challenging]
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a strength coach providing detailed set-by-set workout predictions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.2
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"❌ Error getting predictions: {e}"
    
    def _prepare_workout_data(self):
        summary = "DETAILED WORKOUT DATA ANALYSIS:\n\n"
        
        workouts = self.workout_data if isinstance(self.workout_data, list) else [self.workout_data]
        
        workout_types = {}
        for workout in workouts:
            workout_type = workout.get('workout_type', 'Unknown')
            workout_types[workout_type] = workout_types.get(workout_type, 0) + 1
        
        summary += f"📊 WORKOUT TYPE DISTRIBUTION:\n"
        for wtype, count in workout_types.items():
            summary += f"- {wtype}: {count} sessions\n"
        summary += "\n"
        
        summary += "🏋️ SET-BY-SET EXERCISE ANALYSIS:\n"
        
        exercise_data = {}
        for workout in workouts:
            date = workout.get('date')
            workout_type = workout.get('workout_type', 'Unknown')
            
            for exercise in workout.get('exercises', []):
                ex_name = exercise.get('name')
                weight = exercise.get('weight')
                sets = exercise.get('sets', [])
                
                if ex_name not in exercise_data:
                    exercise_data[ex_name] = []
                
                exercise_data[ex_name].append({
                    'date': date,
                    'workout_type': workout_type,
                    'weight': weight,
                    'sets': sets,
                    'total_reps': sum(s.get('reps', 0) for s in sets),
                    'total_sets': len(sets)
                })
        
        for exercise, sessions in exercise_data.items():
            if len(sessions) >= 2:
                summary += f"\n{exercise}:\n"
                for session in sessions[-3:]:
                    set_details = []
                    for s in session['sets']:
                        set_details.append(f"Set {s.get('set', '?')}: {s.get('reps', '?')} reps")
                    
                    summary += f"  {session['date']} ({session['workout_type']}): {session['weight']}kg\n"
                    summary += f"    {' | '.join(set_details)}\n"
        
        summary += f"\n📋 RECENT DETAILED WORKOUTS:\n"
        recent_workouts = workouts[-3:] if len(workouts) >= 3 else workouts
        
        for workout in recent_workouts:
            summary += f"\n{workout.get('date')} - {workout.get('workout_type', 'Unknown')}:\n"
            for exercise in workout.get('exercises', []):
                summary += f"  {exercise.get('name')} - {exercise.get('weight')}kg:\n"
                for s in exercise.get('sets', []):
                    summary += f"    Set {s.get('set')}: {s.get('reps')} reps\n"
        
        return summary
    
    def _get_detailed_progress(self):
        summary = "DETAILED SET-BY-SET PROGRESSION:\n\n"
        
        workouts = self.workout_data if isinstance(self.workout_data, list) else [self.workout_data]
        
        exercise_trends = {}
        for workout in workouts:
            for exercise in workout.get('exercises', []):
                ex_name = exercise.get('name')
                if ex_name not in exercise_trends:
                    exercise_trends[ex_name] = []
                
                exercise_trends[ex_name].append({
                    'date': workout.get('date'),
                    'weight': exercise.get('weight'),
                    'sets': exercise.get('sets', [])
                })
        
        for exercise, sessions in exercise_trends.items():
            if len(sessions) >= 2:
                summary += f"\n{exercise} PROGRESSION:\n"
                for session in sessions[-2:]:
                    summary += f"  {session['date']}: {session['weight']}kg\n"
                    for s in session['sets']:
                        summary += f"    Set {s.get('set')}: {s.get('reps')} reps\n"
                
                if sessions:
                    last_session = sessions[-1]
                    reps_by_set = [s.get('reps', 0) for s in last_session['sets']]
                    if len(reps_by_set) > 1:
                        fatigue_drop = reps_by_set[0] - reps_by_set[-1]
                        summary += f"    Fatigue pattern: {fatigue_drop} rep drop from first to last set\n"
        
        return summary
    
    def _create_analysis_prompt(self, data_summary, focus_areas=None, nutrition_context=None, sleep_context=None, stress_context=None, hydration_context=None):
        user_info = ""
        if self.user_profile:
            user_info = f"👤 USER PROFILE:\n{json.dumps(self.user_profile, indent=2)}\n\n"
        
        focus_text = ""
        if focus_areas:
            focus_text = f"🎯 FOCUS AREAS: Please pay special attention to: {', '.join(focus_areas)}\n\n"
        
        nutrition_text = ""
        if nutrition_context:
            nutrition_text = f"🍽️ NUTRITION CONTEXT:\n{nutrition_context}\n\n"
        
        sleep_text = ""
        if sleep_context:
            sleep_text = f"😴 SLEEP CONTEXT:\n{sleep_context}\n\n"
        
        stress_text = ""
        if stress_context:
            stress_text = f"😰 STRESS CONTEXT:\n{stress_context}\n\n"
        
        hydration_text = ""
        if hydration_context:
            hydration_text = f"💧 HYDRATION CONTEXT:\n{hydration_context}\n\n"
        
        prompt = f"""
{user_info}{focus_text}{nutrition_text}{sleep_text}{stress_text}{hydration_text}{data_summary}

As an expert fitness coach, analyze this detailed set-by-set workout data and provide:

🔄 1. PROGRESSIVE OVERLOAD ANALYSIS:
- How effectively are they progressing (weight and volume)?
- Set-by-set performance patterns and fatigue analysis
- Which exercises are advancing well vs stagnating?
- Rate overall progression (1-10 scale)

📈 2. WORKOUT TYPE & PROGRAMMING ASSESSMENT:
- Push/Pull/Legs balance and frequency
- Recovery patterns between workout types
- Volume distribution across muscle groups
- Set and rep range effectiveness

🎯 3. SET-BY-SET PERFORMANCE INSIGHTS:
- Fatigue patterns within exercises
- Optimal set and rep schemes based on performance
- Strength endurance vs pure strength focus
- Rest time recommendations between sets

💡 4. PERSONALIZED RECOMMENDATIONS:
- Programming adjustments (workout split, exercise order)
- Progressive overload strategy (weight vs reps vs sets)
- Exercise additions/modifications
- Intensity and volume recommendations

⚠️5. PERFORMANCE CONCERNS:
- Any declining performance patterns
- Potential overtraining in specific muscle groups
- Imbalances between workout types
- Recovery and programming issues

Make it actionable and specific using their actual set-by-set data.
"""
        
        return prompt 