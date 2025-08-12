# Gym Application Backend

A modular, extensible backend for gym and fitness tracking applications.

## Structure

```
backend/
├── core/           # Core functionality
│   ├── analyzer.py # Main workout analyzer
├── data/           # Data handling
│   ├── loaders.py  # Data loaders for different formats
├── metrics/        # Analytics and metrics
│   ├── workout_metrics.py # Workout-specific calculations
├── config/         # Configuration
│   ├── settings.py # App settings and constants
├── main.py         # Main application driver
└── requirements.txt
```

## Usage

1. Set environment variable: `export OPENAI_API_KEY="your-key"`
2. Run: `python main.py`
3. Enter workout data file path when prompted

## Extending

### Adding New Metrics

- Create new metric classes in `metrics/` directory
- Implement calculation methods
- Add to `GymApp.get_metrics()` method

### Adding New Data Sources

- Create new loader classes in `data/loaders.py`
- Implement `DataLoader` interface
- Add to `DataLoaderFactory`

### Adding New Analysis Types

- Extend `WorkoutAnalyzer` class in `core/analyzer.py`
- Add new analysis methods
- Update prompts as needed

## Supported Formats

- JSON workout data
- CSV workout data (converted to internal format)
