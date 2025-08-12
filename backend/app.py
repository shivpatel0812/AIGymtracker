#!/usr/bin/env python3

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from core.analyzer import WorkoutAnalyzer
from core.nutrition_analyzer import NutritionAnalyzer
from core.sleep_analyzer import SleepAnalyzer
from core.stress_analyzer import StressAnalyzer
from core.hydration_analyzer import HydrationAnalyzer
from core.comprehensive_analyzer import ComprehensiveAnalyzer

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class AnalysisService:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.workout_analyzer = WorkoutAnalyzer(api_key)
        self.nutrition_analyzer = NutritionAnalyzer()
        self.sleep_analyzer = SleepAnalyzer()
        self.stress_analyzer = StressAnalyzer()
        self.hydration_analyzer = HydrationAnalyzer()
        self.comprehensive_analyzer = ComprehensiveAnalyzer(
            self.workout_analyzer, 
            self.nutrition_analyzer, 
            self.sleep_analyzer, 
            self.stress_analyzer, 
            self.hydration_analyzer
        )

# Initialize service
try:
    analysis_service = AnalysisService()
    print("✅ Analysis service initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize analysis service: {e}")
    sys.exit(1)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'GymApp AI Analysis API',
        'version': '1.0.0'
    })

@app.route('/analyze', methods=['POST'])
def comprehensive_analysis():
    """Main analysis endpoint that accepts all user data"""
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Extract data components
        nutrition_data = data.get('nutrition', [])
        workout_data = data.get('workouts', [])
        sleep_data = data.get('sleep', [])
        stress_data = data.get('stress', [])
        hydration_data = data.get('hydration', [])
        
        print(f"📊 Processing analysis for user: {user_id}")
        print(f"   - Nutrition entries: {len(nutrition_data)}")
        print(f"   - Workout sessions: {len(workout_data)}")
        print(f"   - Sleep entries: {len(sleep_data)}")
        print(f"   - Stress entries: {len(stress_data)}")
        print(f"   - Hydration entries: {len(hydration_data)}")
        
        # Load data into analyzers
        results = {}
        
        if nutrition_data:
            analysis_service.nutrition_analyzer.load_nutrition_data(nutrition_data)
            nutrition_analysis = analysis_service.nutrition_analyzer.get_weekly_averages()
            if nutrition_analysis:
                results['nutrition_analysis'] = nutrition_analysis
        
        if workout_data:
            analysis_service.workout_analyzer.workout_data = workout_data
            workout_analysis = analysis_service.workout_analyzer.analyze_workouts()
            results['workout_analysis'] = workout_analysis
        
        if sleep_data:
            analysis_service.sleep_analyzer.load_sleep_data(sleep_data)
            sleep_analysis = analysis_service.sleep_analyzer.get_weekly_averages()
            if sleep_analysis:
                results['sleep_analysis'] = sleep_analysis
        
        if stress_data:
            analysis_service.stress_analyzer.load_stress_data(stress_data)
            stress_analysis = analysis_service.stress_analyzer.get_weekly_averages()
            if stress_analysis:
                results['stress_analysis'] = stress_analysis
        
        if hydration_data:
            analysis_service.hydration_analyzer.load_hydration_data(hydration_data)
            hydration_analysis = analysis_service.hydration_analyzer.get_weekly_averages()
            if hydration_analysis:
                results['hydration_analysis'] = hydration_analysis
        
        # Get comprehensive analysis if we have workout data
        if workout_data:
            try:
                comprehensive = analysis_service.comprehensive_analyzer.get_comprehensive_summary()
                results['comprehensive_summary'] = comprehensive
            except Exception as e:
                print(f"⚠️ Comprehensive analysis failed: {e}")
                results['comprehensive_summary'] = "Analysis available with individual components only"
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'analysis': results,
            'data_summary': {
                'nutrition_days': len(nutrition_data),
                'workout_sessions': len(workout_data),
                'sleep_days': len(sleep_data),
                'stress_days': len(stress_data),
                'hydration_days': len(hydration_data)
            }
        })
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/nutrition/analyze', methods=['POST'])
def nutrition_analysis():
    """Nutrition-specific analysis endpoint"""
    try:
        data = request.json
        user_id = data.get('user_id')
        nutrition_data = data.get('nutrition', [])
        
        if not nutrition_data:
            return jsonify({'error': 'nutrition data is required'}), 400
        
        print(f"🥗 Processing nutrition analysis for user: {user_id}")
        print(f"   - Nutrition entries: {len(nutrition_data)}")
        
        analysis_service.nutrition_analyzer.load_nutrition_data(nutrition_data)
        results = analysis_service.nutrition_analyzer.get_weekly_averages()
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'analysis': results,
            'data_summary': {
                'nutrition_days': len(nutrition_data)
            }
        })
        
    except Exception as e:
        print(f"❌ Nutrition analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/workout/analyze', methods=['POST'])
def workout_analysis():
    """Workout-specific analysis endpoint"""
    try:
        data = request.json
        user_id = data.get('user_id')
        workout_data = data.get('workouts', [])
        
        if not workout_data:
            return jsonify({'error': 'workout data is required'}), 400
        
        print(f"🏋️ Processing workout analysis for user: {user_id}")
        print(f"   - Workout sessions: {len(workout_data)}")
        
        analysis_service.workout_analyzer.workout_data = workout_data
        results = analysis_service.workout_analyzer.analyze_workouts()
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'analysis': results,
            'data_summary': {
                'workout_sessions': len(workout_data)
            }
        })
        
    except Exception as e:
        print(f"❌ Workout analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

if __name__ == '__main__':
    print("🚀 Starting GymApp AI Analysis API Server...")
    print("=" * 50)
    print("📡 Server will run on: http://localhost:8000")
    print("🔗 Available endpoints:")
    print("   - GET  /health")
    print("   - POST /analyze")
    print("   - POST /nutrition/analyze") 
    print("   - POST /workout/analyze")
    print("=" * 50)
    
    # Run the Flask development server
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True
    )