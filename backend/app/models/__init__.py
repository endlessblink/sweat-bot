# SQLAlchemy models package

# Import all models to make them available
from .models import (
    User, Workout, Exercise, Goal, Achievement,
    PersonalRecord, GamificationStats, VoiceCommand
)

# Import Points System v3 models
from .points_models_v3 import (
    PointsConfigurationV3,
    PointsCalculationV3,
    UserPointsSummaryV3,
    UserAchievementV3,
    LeaderboardCacheV3,
    PointsConfigAuditV3
)

__all__ = [
    'User', 'Workout', 'Exercise', 'Goal', 'Achievement',
    'PersonalRecord', 'GamificationStats', 'VoiceCommand',
    # Points v3 models
    'PointsConfigurationV3', 'PointsCalculationV3', 'UserPointsSummaryV3',
    'UserAchievementV3', 'LeaderboardCacheV3', 'PointsConfigAuditV3'
]