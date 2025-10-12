# SQLAlchemy models package

# Import all models to make them available
from .models import (
    User, Workout, Exercise, Goal, Achievement,
    PersonalRecord, GamificationStats, VoiceCommand
)

# Import Points System v4 models
from .points_models_v4 import (
    ExerciseType,
    ActivityLog,
    ActivityStrengthSet,
    ActivityCardio,
    ActivityCore,
    PointsCalculation,
    UserStatsDaily,
    UserStatsSummary,
    UserPersonalRecord,
    UserStreak,
    AchievementDefinition,
    UserAchievement,
    UserAchievementProgress,
    LeaderboardEntry,
    SocialFriend,
    Team,
    TeamMember,
    Challenge,
    ChallengeParticipant
)

# DEPRECATED: Points System v3 models (tables exist in DB but not used in code)
# from .points_models_v3 import (
#     PointsConfigurationV3,
#     PointsCalculationV3,
#     UserPointsSummaryV3,
#     UserAchievementV3,
#     LeaderboardCacheV3,
#     PointsConfigAuditV3
# )

__all__ = [
    'User', 'Workout', 'Exercise', 'Goal', 'Achievement',
    'PersonalRecord', 'GamificationStats', 'VoiceCommand',
    # Points v4 models
    'ExerciseType', 'ActivityLog', 'ActivityStrengthSet', 'ActivityCardio', 'ActivityCore',
    'PointsCalculation', 'UserStatsDaily', 'UserStatsSummary', 'UserPersonalRecord', 'UserStreak',
    'AchievementDefinition', 'UserAchievement', 'UserAchievementProgress',
    'LeaderboardEntry', 'SocialFriend', 'Team', 'TeamMember', 'Challenge', 'ChallengeParticipant'
]