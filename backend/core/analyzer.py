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
                max_tokens=2000,
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
        
        summary += f"TOTAL EXERCISES TO ANALYZE: {len(exercise_data)} exercises\n\n"
        
        for exercise, sessions in exercise_data.items():
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
    
    def _get_4_week_cycle_summary(self, workouts):
        """Generate 4-week cycle analysis for progressive overload planning"""
        if len(workouts) < 4:
            return "📊 CYCLE STATUS: Insufficient data for 4-week cycle analysis\n\n"
        
        # Group workouts into weeks (assuming 2-3 workouts per week)
        weeks = []
        current_week = []
        workouts_per_week = 3  # Estimate
        
        for i, workout in enumerate(workouts):
            current_week.append(workout)
            if len(current_week) >= workouts_per_week or i == len(workouts) - 1:
                weeks.append(current_week)
                current_week = []
        
        if len(weeks) < 2:
            return "📊 CYCLE STATUS: Building data for cycle analysis\n\n"
        
        # Analyze current vs previous week
        current_week = weeks[-1]
        previous_week = weeks[-2] if len(weeks) > 1 else []
        
        summary = "📊 4-WEEK PROGRESSIVE OVERLOAD CYCLE:\n"
        summary += f"Current Week: {len(current_week)} workouts | Previous Week: {len(previous_week)} workouts\n\n"
        
        # Calculate volume progression between weeks
        if previous_week and current_week:
            prev_volume = sum(self._calculate_workout_volume(w) for w in previous_week)
            curr_volume = sum(self._calculate_workout_volume(w) for w in current_week)
            
            if prev_volume > 0:
                volume_change = ((curr_volume - prev_volume) / prev_volume) * 100
                summary += f"📈 Volume Change: {volume_change:+.1f}%\n"
        
        summary += "\n"
        return summary
    
    def _calculate_workout_volume(self, workout):
        """Calculate total workout volume (weight x reps)"""
        total_volume = 0
        for exercise in workout.get('exercises', []):
            weight = exercise.get('weight', 0)
            total_reps = sum(s.get('reps', 0) for s in exercise.get('sets', []))
            total_volume += weight * total_reps
        return total_volume
    
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
{user_info}{data_summary}

IMPORTANT: You must provide plans for ALL exercises listed above (see "TOTAL EXERCISES TO ANALYZE"). Do not skip any exercise.

🎯 PLAN A - PURE PROGRESSIVE OVERLOAD (4 weeks):
For EVERY SINGLE exercise in the data above, provide:
- Week 1-2: Weight/rep/set targets with rest times
- Week 3-4: Progressive increases
- Focus on traditional progression (weight up, reps up, or volume up)

🔍 PLATEAU ANALYSIS:
Check for stagnation patterns (same weight 3+ sessions, declining reps, etc.)

⚡ PLAN B - STRATEGIC ALTERNATIVE (only if stagnation detected):
ONLY suggest if you identify clear plateaus. For stuck exercises:
- Exercise swap for different loading (e.g., incline press → flat press for heavier weight/lower reps)
- Different rep ranges to break through
- 4-week timeline with this strategic approach

If no significant stagnation, skip Plan B entirely. MUST cover all exercises.
"""
        
        return prompt 