import express from 'express';
import { logger } from '../../utils/logger';
import { postgresUserService } from '../../services/postgresUserService';

const router = express.Router();

// Get comprehensive exercise library
router.get('/library', async (req, res) => {
  try {
    const { category, difficulty, muscleGroup } = req.query;

    // Mock exercise library
    const exerciseLibrary = [
      {
        id: 'ex_001',
        name: 'Push-ups',
        nameHe: 'שכיבות שכיבות',
        category: 'strength',
        difficulty: 'beginner',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        equipment: 'none',
        instructions: [
          'Start in a plank position with hands shoulder-width apart',
          'Lower your body until your chest nearly touches the floor',
          'Push back up to the starting position',
          'Keep your core engaged throughout the movement'
        ],
        instructionsHe: [
          'התחל בעמידת פלנק עם ידיים ברוחב הכתפיים',
          'הורד את הגוף עד שהחזה כמעט נוגע ברצפה',
          'דחף חזרה לעמדת ההתחלה',
          'שמור את שרירי הבטן פעילים לאורך התנועה'
        ],
        tips: [
          'Keep your back straight',
          'Breathe out on the way up',
          'Modify by doing push-ups on knees if needed'
        ],
        caloriesPerMinute: 7,
        videoUrl: 'https://example.com/pushups-demo',
        imageUrls: ['https://example.com/pushups-1.jpg', 'https://example.com/pushups-2.jpg']
      },
      {
        id: 'ex_002',
        name: 'Squats',
        nameHe: 'סקוואטים',
        category: 'strength',
        difficulty: 'beginner',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: 'none',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body as if sitting in a chair',
          'Keep your chest up and back straight',
          'Return to the starting position'
        ],
        instructionsHe: [
          'עמוד עם רגליים ברוחב הכתפיים',
          'הורד את הגוף כאילו יושב בכיסא',
          'שמור את החזה מורמת והגב ישר',
          'חזור לעמדת ההתחלה'
        ],
        tips: [
          'Don\'t let your knees go past your toes',
          'Keep weight in your heels',
          'Go as low as you comfortably can'
        ],
        caloriesPerMinute: 8,
        videoUrl: 'https://example.com/squats-demo',
        imageUrls: ['https://example.com/squats-1.jpg', 'https://example.com/squats-2.jpg']
      },
      {
        id: 'ex_003',
        name: 'Running (treadmill)',
        nameHe: 'ריצה (הליכון)',
        category: 'cardio',
        difficulty: 'beginner',
        muscleGroups: ['legs', 'core', 'cardiovascular'],
        equipment: 'treadmill',
        instructions: [
          'Start with a 5-minute warm-up walk',
          'Gradually increase speed to a comfortable running pace',
          'Maintain good posture with arms swinging naturally',
          'Cool down with 5-minute walk'
        ],
        instructionsHe: [
          'התחל עם הליכה קלה של 5 דקות',
          'הגבר את המהירות בהדרגה לקצב ריצה נוח',
          'שמור על יציבה טובה עם זרועות מתנועעות באופן טבעי',
          'התקרר עם הליכה של 5 דקות'
        ],
        tips: [
          'Start slow and build endurance',
          'Stay hydrated',
          'Listen to your body and rest when needed'
        ],
        caloriesPerMinute: 12,
        videoUrl: 'https://example.com/treadmill-demo',
        imageUrls: ['https://example.com/treadmill-1.jpg']
      },
      {
        id: 'ex_004',
        name: 'Plank',
        nameHe: 'פלנק',
        category: 'strength',
        difficulty: 'intermediate',
        muscleGroups: ['core', 'shoulders', 'back'],
        equipment: 'none',
        instructions: [
          'Start in a push-up position',
          'Lower onto your forearms',
          'Keep your body in a straight line from head to heels',
          'Hold the position'
        ],
        instructionsHe: [
          'התחל בעמידת שכיבות שכיבות',
          'הורד על האמות',
          'שמור את הגוף בקו ישר מהראש ועד העקבים',
          'החזק את העמדה'
        ],
        tips: [
          'Engage your core muscles',
          'Don\'t let your hips sag',
          'Breathe normally'
        ],
        caloriesPerMinute: 5,
        videoUrl: 'https://example.com/plank-demo',
        imageUrls: ['https://example.com/plank-1.jpg', 'https://example.com/plank-2.jpg']
      },
      {
        id: 'ex_005',
        name: 'Yoga - Sun Salutation',
        nameHe: 'יוגה - השאמת לשמש',
        category: 'flexibility',
        difficulty: 'beginner',
        muscleGroups: ['full_body', 'flexibility'],
        equipment: 'yoga_mat',
        instructions: [
          'Stand at the top of your mat with hands in prayer position',
          'Inhale and raise arms overhead',
          'Exhale and fold forward',
          'Inhale and step back into plank',
          'Exhale and lower down',
          'Inhale and push up to upward-facing dog',
          'Exhale and push back to downward-facing dog',
          'Hold for several breaths, then step forward and repeat'
        ],
        instructionsHe: [
          'עמוד בחלק העליון של המזרן עם ידיים בעמדת תפילה',
          'שאף והרם זרועות מעל הראש',
          'נשוף והתכופף קדימה',
          'שאף וצעד אחורה לפלנק',
          'נשוף והורד',
          'שאף ודחף לכלב מביט כלפיים מעלה',
          'נשוף ודחף חזרה לכלב מביט כלפיים מטה',
          'החזק לכמה נשימות, אז צעד קדימה וחזור'
        ],
        tips: [
          'Move with your breath',
          'Modify poses as needed for your level',
          'Focus on proper alignment'
        ],
        caloriesPerMinute: 4,
        videoUrl: 'https://example.com/sun-salutation-demo',
        imageUrls: ['https://example.com/sun-salutation-1.jpg', 'https://example.com/sun-salutation-2.jpg']
      }
    ];

    // Filter exercises based on query parameters
    let filteredExercises = exerciseLibrary;

    if (category) {
      filteredExercises = filteredExercises.filter(ex => ex.category === category);
    }

    if (difficulty) {
      filteredExercises = filteredExercises.filter(ex => ex.difficulty === difficulty);
    }

    if (muscleGroup) {
      filteredExercises = filteredExercises.filter(ex =>
        ex.muscleGroups.includes(muscleGroup as string)
      );
    }

    res.json({
      success: true,
      data: {
        exercises: filteredExercises,
        total: filteredExercises.length,
        categories: ['strength', 'cardio', 'flexibility'],
        difficulties: ['beginner', 'intermediate', 'advanced'],
        muscleGroups: ['chest', 'shoulders', 'triceps', 'quadriceps', 'glutes', 'hamstrings', 'core', 'back', 'legs', 'full_body']
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching exercise library:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exercise library'
    });
  }
});

// Get personalized workout recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const {
      userId,
      fitnessLevel,
      goals,
      availableTime,
      equipment,
      preferences
    } = req.body;

    // Mock AI-powered workout recommendations
    const recommendations = [
      {
        id: 'rec_001',
        title: 'Full Body Strength - Beginner',
        titleHe: 'כוח מלא לגוף - מתחילים',
        duration: 30,
        difficulty: 'beginner',
        goals: ['strength', 'general_fitness'],
        exercises: [
          {
            exerciseId: 'ex_002',
            name: 'Squats',
            sets: 3,
            reps: 12,
            restTime: 60,
            notes: 'Focus on form over speed'
          },
          {
            exerciseId: 'ex_001',
            name: 'Push-ups',
            sets: 3,
            reps: 8,
            restTime: 60,
            notes: 'Can modify with knees on ground'
          },
          {
            exerciseId: 'ex_004',
            name: 'Plank',
            sets: 3,
            duration: 30,
            restTime: 45,
            notes: 'Keep core engaged'
          }
        ],
        estimatedCalories: 180,
        warmup: [
          { exercise: 'Jumping jacks', duration: 120 },
          { exercise: 'Arm circles', duration: 60 }
        ],
        cooldown: [
          { exercise: 'Stretching', duration: 180 }
        ],
        aiGenerated: true,
        confidence: 0.92,
        reasoning: 'Based on your beginner level and general fitness goals, this workout provides a balanced full-body routine.'
      },
      {
        id: 'rec_002',
        title: 'Cardio Blast - Quick Workout',
        titleHe: 'קרדיו אינטנסיבי - אימון מהיר',
        duration: 20,
        difficulty: 'intermediate',
        goals: ['cardio', 'weight_loss'],
        exercises: [
          {
            exerciseId: 'ex_003',
            name: 'Running',
            sets: 1,
            duration: 600,
            intensity: 'moderate',
            notes: 'Maintain steady pace'
          },
          {
            exerciseId: 'ex_003',
            name: 'Running',
            sets: 1,
            duration: 300,
            intensity: 'high',
            notes: 'Increase speed for intervals'
          },
          {
            exerciseId: 'ex_003',
            name: 'Running',
            sets: 1,
            duration: 300,
            intensity: 'moderate',
            notes: 'Recovery pace'
          }
        ],
        estimatedCalories: 200,
        warmup: [
          { exercise: 'Walking', duration: 180 }
        ],
        cooldown: [
          { exercise: 'Walking', duration: 180 }
        ],
        aiGenerated: true,
        confidence: 0.88,
        reasoning: 'High-intensity interval training is excellent for cardiovascular health and calorie burn.'
      }
    ];

    res.json({
      success: true,
      data: {
        recommendations,
        userPreferences: {
          fitnessLevel,
          goals,
          availableTime,
          equipment,
          preferences
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating workout recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate workout recommendations'
    });
  }
});

// Log workout with enhanced tracking using PostgreSQL
router.post('/log', async (req, res) => {
  try {
    const {
      userId,
      exercises,
      notes,
      workoutType = 'strength'
    } = req.body;

    if (!userId || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      res.status(400).json({
        success: false,
        error: 'userId and exercises array are required'
      });
      return;
    }

    const loggedExercises = [];
    let totalPointsEarned = 0;

    // Log each exercise to PostgreSQL
    for (const exercise of exercises) {
      const loggedExercise = await postgresUserService.logExercise({
        user_id: userId,
        exercise_name: exercise.exerciseName || exercise.name,
        sets: parseInt(exercise.sets) || 1,
        reps: parseInt(exercise.reps) || 1,
        weight: exercise.weight ? parseFloat(exercise.weight) : undefined,
        duration: exercise.duration ? parseInt(exercise.duration) : undefined,
        distance: exercise.distance ? parseInt(exercise.distance) : undefined,
        notes: exercise.notes || notes,
        workout_type: exercise.workoutType || workoutType
      });

      loggedExercises.push({
        id: loggedExercise.id,
        exerciseName: loggedExercise.exercise_name,
        sets: loggedExercise.sets,
        reps: loggedExercise.reps,
        weight: loggedExercise.weight,
        duration: loggedExercise.duration,
        distance: loggedExercise.distance,
        notes: loggedExercise.notes,
        workoutType: loggedExercise.workout_type,
        createdAt: loggedExercise.created_at
      });

      // Points are automatically awarded in the service
      totalPointsEarned += Math.floor(Math.random() * 20) + 10;
    }

    // Generate achievements based on workout
    const achievements = [];
    if (loggedExercises.length >= 5) {
      achievements.push({
        type: 'variety',
        name: 'Exercise Variety',
        points: 30
      });
    }
    if (loggedExercises.some(ex => ex.sets >= 3)) {
      achievements.push({
        type: 'intensity',
        name: 'High Intensity',
        points: 25
      });
    }

    const workoutLog = {
      id: `workout_${Date.now()}`,
      userId,
      exercises: loggedExercises,
      totalExercises: loggedExercises.length,
      totalSets: loggedExercises.reduce((sum, ex) => sum + ex.sets, 0),
      totalReps: loggedExercises.reduce((sum, ex) => sum + ex.reps, 0),
      pointsEarned: totalPointsEarned,
      achievements,
      completedAt: new Date().toISOString(),
      notes
    };

    res.status(201).json({
      success: true,
      data: workoutLog,
      message: `Workout logged successfully! Earned ${totalPointsEarned} points`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error logging workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log workout'
    });
  }
});

export { router as exercisesEnhancedRouter };