import { test, expect } from '@playwright/test';

test.describe('Exercise Tracking', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Register a test user for exercise tests
    const testUser = {
      email: `exercise-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Exercise Test User'
    };

    const registerResponse = await request.post('/auth/register', {
      data: testUser
    });

    const data = await registerResponse.json();
    authToken = data.data.token;
    userId = data.data.user.id;
  });

  test('log single exercise', async ({ request }) => {
    const exerciseData = {
      exerciseName: 'Push-ups',
      sets: 3,
      reps: 15,
      weight: 0,
      workoutType: 'strength'
    };

    const response = await request.post('/exercises', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: exerciseData
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message', 'Exercise logged successfully');
    expect(data).toHaveProperty('data');

    const { exercise, pointsAwarded } = data.data;
    expect(exercise).toHaveProperty('exerciseName', 'Push-ups');
    expect(exercise).toHaveProperty('sets', 3);
    expect(exercise).toHaveProperty('reps', 15);
    expect(exercise).toHaveProperty('workoutType', 'strength');
    expect(exercise).toHaveProperty('createdAt');
    expect(pointsAwarded).toBeGreaterThan(0);

    console.log(`\n💪 Exercise Logged:`);
    console.log(`Exercise: ${exercise.exerciseName}`);
    console.log(`Sets: ${exercise.sets} x ${exercise.reps}`);
    console.log(`Points: ${pointsAwarded}\n`);
  });

  test('log exercise with weight', async ({ request }) => {
    const exerciseData = {
      exerciseName: 'Bench Press',
      sets: 3,
      reps: 10,
      weight: 135.5,
      workoutType: 'strength'
    };

    const response = await request.post('/exercises', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: exerciseData
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    const { exercise } = data.data;

    expect(exercise.weight).toBe(135.5);
    expect(exercise.exerciseName).toBe('Bench Press');
  });

  test('log cardio exercise', async ({ request }) => {
    const exerciseData = {
      exerciseName: 'Running',
      sets: 1,
      reps: 30,
      workoutType: 'cardio'
    };

    const response = await request.post('/exercises', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: exerciseData
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    const { exercise } = data.data;

    expect(exercise.workoutType).toBe('cardio');
    expect(exercise.exerciseName).toBe('Running');
  });

  test('get exercise history', async ({ request }) => {
    // Log a few exercises first
    const exercises = [
      { exerciseName: 'Squats', sets: 3, reps: 20, workoutType: 'strength' },
      { exerciseName: 'Deadlifts', sets: 3, reps: 5, weight: 225, workoutType: 'strength' },
      { exerciseName: 'Pull-ups', sets: 2, reps: 8, workoutType: 'strength' }
    ];

    for (const exercise of exercises) {
      await request.post('/exercises', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: exercise
      });
    }

    // Get exercise history
    const response = await request.get('/exercises', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('exercises');
    expect(data.data.exercises).toBeInstanceOf(Array);
    expect(data.data.exercises.length).toBeGreaterThan(0);

    const exercises = data.data.exercises;
    exercises.forEach(exercise => {
      expect(exercise).toHaveProperty('exerciseName');
      expect(exercise).toHaveProperty('sets');
      expect(exercise).toHaveProperty('reps');
      expect(exercise).toHaveProperty('createdAt');
    });
  });

  test('get exercise statistics', async ({ request }) => {
    // Log some exercises first
    await request.post('/exercises', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        exerciseName: 'Push-ups',
        sets: 2,
        reps: 12,
        workoutType: 'strength'
      }
    });

    const response = await request.get('/exercises/stats', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('period');
    expect(data.data).toHaveProperty('workouts');
    expect(data.data).toHaveProperty('volume');
    expect(data.data).toHaveProperty('points');

    const { workouts, volume } = data.data;
    expect(workouts).toHaveProperty('totalWorkouts');
    expect(workouts).toHaveProperty('workoutDays');
    expect(volume).toHaveProperty('totalSets');
    expect(volume).toHaveProperty('totalReps');

    console.log(`\n📊 Exercise Statistics:`);
    console.log(`Period: ${data.data.period}`);
    console.log(`Total Workouts: ${workouts.totalWorkouts}`);
    console.log(`Workout Days: ${workouts.workoutDays}`);
    console.log(`Total Sets: ${volume.totalSets}`);
    console.log(`Total Reps: ${volume.totalReps}\n`);
  });

  test('get exercise recommendations', async ({ request }) => {
    const response = await request.get('/exercises/recommendations', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('recommendations');
    expect(data.data.recommendations).toBeInstanceOf(Array);
    expect(data.data.recommendations.length).toBeGreaterThan(0);

    const recommendations = data.data.recommendations;
    recommendations.forEach(rec => {
      expect(rec).toHaveProperty('name');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('difficulty');
      expect(rec).toHaveProperty('equipment');
      expect(rec).toHaveProperty('reason');
    });
  });

  test('log workout session with multiple exercises', async ({ request }) => {
    const workoutData = {
      exercises: [
        {
          exerciseName: 'Push-ups',
          sets: 3,
          reps: 15,
          workoutType: 'strength'
        },
        {
          exerciseName: 'Squats',
          sets: 4,
          reps: 20,
          workoutType: 'strength'
        },
        {
          exerciseName: 'Plank',
          sets: 3,
          reps: 1,
          workoutType: 'flexibility'
        }
      ],
      workoutNotes: 'Great workout session! Feeling stronger.',
      workoutType: 'strength'
    };

    const response = await request.post('/exercises/bulk', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: workoutData
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message', 'Workout logged successfully');
    expect(data).toHaveProperty('data');

    const { exercises, totalPoints, workoutBonus } = data.data;
    expect(exercises.length).toBe(3);
    expect(totalPoints).toBeGreaterThan(workoutBonus); // Should include individual exercise points + bonus
    expect(workoutBonus).toBeGreaterThan(0); // Should get bonus for multiple exercises

    console.log(`\n🏋️ Workout Session Completed:`);
    console.log(`Exercises: ${exercises.length}`);
    console.log(`Individual Points: ${totalPoints - workoutBonus}`);
    console.log(`Workout Bonus: ${workoutBonus}`);
    console.log(`Total Points: ${totalPoints}\n`);
  });

  test('get exercise library', async ({ request }) => {
    const response = await request.get('/exercises/library', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('exercises');
    expect(data.data).toHaveProperty('total');

    const { exercises } = data.data;
    expect(exercises).toBeInstanceOf(Array);
    expect(exercises.length).toBeGreaterThan(0);

    exercises.forEach(exercise => {
      expect(exercise).toHaveProperty('name');
      expect(exercise).toHaveProperty('category');
      expect(exercise).toHaveProperty('muscleGroup');
      expect(exercise).toHaveProperty('difficulty');
      expect(exercise).toHaveProperty('equipment');
    });
  });

  test('filter exercise library by category', async ({ request }) => {
    const response = await request.get('/exercises/library?category=strength', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const { exercises } = data.data;

    // All returned exercises should be strength category
    exercises.forEach(exercise => {
      expect(exercise.category).toBe('strength');
    });
  });

  test('protected exercise endpoints', async ({ request }) => {
    // Test without authentication
    const response1 = await request.post('/exercises', {
      data: {
        exerciseName: 'Test',
        sets: 1,
        reps: 1,
        workoutType: 'strength'
      }
    });

    expect(response1.status()).toBe(401);

    // Test with invalid token
    const response2 = await request.post('/exercises', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      },
      data: {
        exerciseName: 'Test',
        sets: 1,
        reps: 1,
        workoutType: 'strength'
      }
    });

    expect(response2.status()).toBe(401);
  });

  test('exercise validation', async ({ request }) => {
    // Test invalid exercise data
    const invalidData = {
      exerciseName: '', // Empty name
      sets: -1, // Invalid sets
      reps: 0, // Invalid reps
      workoutType: 'invalid' // Invalid type
    };

    const response = await request.post('/exercises', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidData
    });

    expect(response.status()).toBe(400);
  });
});