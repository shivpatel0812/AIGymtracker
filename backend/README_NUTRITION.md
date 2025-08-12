# Nutrition & Joint Analysis Features

This backend now supports comprehensive analysis combining workout and nutrition data for better fitness insights.

## New Components

### 1. Nutrition Data Loaders (`data/nutrition_loader.py`)

- **JSONNutritionLoader**: Loads nutrition data from JSON files
- **CSVNutritionLoader**: Loads nutrition data from CSV files
- Supports daily food entries with macro breakdowns

### 2. Nutrition Analyzer (`core/nutrition_analyzer.py`)

- Daily macro tracking (calories, protein, carbs, fat)
- Weekly averages and trends
- Macro balance analysis
- Nutrition summary generation

### 3. Joint Analyzer (`core/joint_analyzer.py`)

- Combines workout and nutrition data
- Daily joint analysis with recovery assessment
- Weekly correlation insights
- Performance-nutrition correlation
- Personalized recommendations

## Data Format

### Nutrition Data Structure

```json
[
  {
    "date": "2024-01-15",
    "foods": [
      {
        "name": "Chicken breast",
        "calories": 250,
        "protein": 35,
        "carbs": 0,
        "fat": 5
      }
    ]
  }
]
```

### CSV Format

```
Date,Food,Calories,Protein,Carbs,Fat
2024-01-15,Chicken breast,250,35,0,5
```

## Usage

### Basic Usage

```python
from core.joint_analyzer import JointAnalyzer
from core.nutrition_analyzer import NutritionAnalyzer

# Load nutrition data
nutrition_analyzer = NutritionAnalyzer()
nutrition_analyzer.load_nutrition_data(nutrition_data)

# Get daily macros
daily_macros = nutrition_analyzer.get_daily_macros("2024-01-15")

# Get joint analysis
joint_analyzer = JointAnalyzer(workout_analyzer, nutrition_analyzer)
daily_analysis = joint_analyzer.get_daily_analysis("2024-01-15")
```

### Main Application

```bash
python main.py
# Enter workout data file path
# Enter nutrition data file path (optional)
```

## Features

### Daily Analysis

- Workout intensity assessment
- Nutrition adequacy for recovery
- Performance correlation analysis
- Personalized recommendations

### Weekly Analysis

- Workout volume trends
- Nutrition trends
- Correlation insights
- Weekly recommendations

### Recovery Analysis

- Protein adequacy assessment
- Carb adequacy assessment
- Calorie adequacy assessment
- Recovery quality scoring

## Sample Data

Use `sample_nutrition_data.json` to test the functionality with realistic nutrition data.

## Testing

Run the test script to verify functionality:

```bash
python test_joint_analysis.py
```
