import { Exercise } from '../entities/Exercise';
import { Workout } from '../entities/Workout';
import { PersonalRecord } from '../entities/PersonalRecord';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { IsNull } from 'typeorm';
import {
  CreateExerciseRequest,
  ExerciseResponse,
  WorkoutResponse,
  PersonalRecordResponse,
  PointsBreakdown
} from '../types';

export class ExerciseService {
  private exerciseRepository = AppDataSource.getRepository(Exercise);
  private workoutRepository = AppDataSource.getRepository(Workout);
  private personalRecordRepository = AppDataSource.getRepository(PersonalRecord);
  private userRepository = AppDataSource.getRepository(User);

  async logExercise(userId: string, exerciseData: CreateExerciseRequest): Promise<ExerciseResponse> {
    // Find or create workout session
    let workout = await this.findOrCreateWorkout(userId);

    // Create exercise
    const exercise = this.exerciseRepository.create({
      ...exerciseData,
      userId,
      workoutId: workout.id,
      timestamp: new Date(),
      points: this.calculateExercisePoints(exerciseData)
    });

    const savedExercise = await this.exerciseRepository.save(exercise);

    // Update workout totals
    await this.updateWorkoutTotals(workout.id);

    // Check for personal records
    await this.checkPersonalRecords(userId, savedExercise);

    // Update user's total points
    await this.updateUserTotalPoints(userId);

    return this.formatExerciseResponse(savedExercise);
  }

  async getUserExercises(userId: string, limit: number = 50): Promise<ExerciseResponse[]> {
    const exercises = await this.exerciseRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
      relations: ['workout']
    });

    return exercises.map(exercise => this.formatExerciseResponse(exercise));
  }

  async getWorkoutHistory(userId: string, limit: number = 20): Promise<WorkoutResponse[]> {
    const workouts = await this.workoutRepository.find({
      where: { userId },
      order: { startTime: 'DESC' },
      take: limit,
      relations: ['exercises']
    });

    return workouts.map(workout => this.formatWorkoutResponse(workout));
  }

  async getPersonalRecords(userId: string): Promise<PersonalRecordResponse[]> {
    const records = await this.personalRecordRepository.find({
      where: { userId },
      order: { achievedAt: 'DESC' },
      relations: ['exercise']
    });

    return records.map(record => this.formatPersonalRecordResponse(record));
  }

  async getExerciseStats(userId: string, period: 'week' | 'month' | 'year' = 'week'): Promise<any> {
    const dateFilter = this.getDateFilter(period);

    const [totalPoints, exerciseCount, workoutCount] = await Promise.all([
      this.exerciseRepository
        .createQueryBuilder('exercise')
        .select('SUM(exercise.points)', 'total')
        .where('exercise.userId = :userId', { userId })
        .andWhere('exercise.timestamp >= :date', { date: dateFilter })
        .getRawOne(),

      this.exerciseRepository
        .createQueryBuilder('exercise')
        .where('exercise.userId = :userId', { userId })
        .andWhere('exercise.timestamp >= :date', { date: dateFilter })
        .getCount(),

      this.workoutRepository
        .createQueryBuilder('workout')
        .where('workout.userId = :userId', { userId })
        .andWhere('workout.startTime >= :date', { date: dateFilter })
        .getCount()
    ]);

    return {
      period,
      totalPoints: parseInt(totalPoints?.total || '0'),
      totalExercises: exerciseCount,
      totalWorkouts: workoutCount,
      dateRange: {
        start: dateFilter,
        end: new Date()
      }
    };
  }

  async deleteExercise(exerciseId: string, userId: string): Promise<void> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id: exerciseId, userId }
    });

    if (!exercise) {
      throw new Error('Exercise not found');
    }

    await this.exerciseRepository.remove(exercise);

    // Update related data
    await this.updateWorkoutTotals(exercise.workoutId);
    await this.updateUserTotalPoints(userId);
  }

  private async findOrCreateWorkout(userId: string): Promise<Workout> {
    // Check if there's an active workout (within last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    let activeWorkout = await this.workoutRepository.findOne({
      where: {
        userId,
        endTime: IsNull()
      }
    });

    // Check if the existing workout is recent (within last 2 hours)
    if (activeWorkout && activeWorkout.startTime >= twoHoursAgo) {
      return activeWorkout;
    }

    if (!activeWorkout) {
      // Create new workout session
      activeWorkout = this.workoutRepository.create({
        userId,
        startTime: new Date(),
        totalPoints: 0,
        totalExercises: 0,
        duration: 0
      });
      activeWorkout = await this.workoutRepository.save(activeWorkout);
    }

    return activeWorkout;
  }

  private calculateExercisePoints(exercise: CreateExerciseRequest): number {
    let basePoints = 1; // Minimum points for any exercise

    // Exercise type multiplier
    const typeMultipliers = {
      'strength': 1.5,
      'cardio': 1.2,
      'flexibility': 1.0,
      'balance': 1.1,
      'sports': 1.3,
      'other': 1.0
    };

    basePoints *= typeMultipliers[exercise.type] || 1.0;

    // Intensity bonus
    if (exercise.intensity) {
      basePoints *= { 'low': 0.8, 'medium': 1.0, 'high': 1.3 }[exercise.intensity] || 1.0;
    }

    // Duration bonus (for cardio/endurance)
    if (exercise.durationMinutes && exercise.type === 'cardio') {
      basePoints += Math.floor(exercise.durationMinutes / 10) * 0.5;
    }

    // Volume bonus (for strength training)
    if (exercise.sets && exercise.reps) {
      const volume = exercise.sets * exercise.reps;
      basePoints += Math.floor(volume / 10) * 0.3;
    }

    // Weight bonus (for weighted exercises)
    if (exercise.weightKg) {
      basePoints += (exercise.weightKg / 50) * 0.5;
    }

    return Math.round(basePoints * 10) / 10; // Round to 1 decimal place
  }

  private async updateWorkoutTotals(workoutId: string): Promise<void> {
    const exercises = await this.exerciseRepository.find({
      where: { workoutId }
    });

    const totalPoints = exercises.reduce((sum, ex) => sum + ex.points, 0);
    const totalExercises = exercises.length;

    await this.workoutRepository.update(workoutId, {
      totalPoints,
      totalExercises
    });
  }

  private async checkPersonalRecords(userId: string, exercise: Exercise): Promise<void> {
    const exerciseName = exercise.nameHe || exercise.nameEn;

    // Check for existing PR in this exercise type
    const existingPR = await this.personalRecordRepository.findOne({
      where: {
        userId,
        exerciseType: exercise.type,
        recordType: this.getRecordType(exercise)
      }
    });

    const recordValue = this.getRecordValue(exercise);
    const isNewRecord = !existingPR || recordValue > existingPR.value;

    if (isNewRecord) {
      if (existingPR) {
        // Update existing PR
        existingPR.value = recordValue;
        existingPR.achievedAt = new Date();
        existingPR.exercise = exercise;
        await this.personalRecordRepository.save(existingPR);
      } else {
        // Create new PR
        const newPR = this.personalRecordRepository.create({
          userId,
          exerciseType: exercise.type,
          recordType: this.getRecordType(exercise),
          value: recordValue,
          achievedAt: new Date(),
          exercise
        });
        await this.personalRecordRepository.save(newPR);
      }
    }
  }

  private getRecordType(exercise: Exercise): string {
    if (exercise.weightKg && exercise.reps) {
      return 'volume';
    } else if (exercise.weightKg) {
      return 'weight';
    } else if (exercise.reps) {
      return 'reps';
    } else if (exercise.durationMinutes) {
      return 'duration';
    } else if (exercise.distanceKm) {
      return 'distance';
    }
    return 'points';
  }

  private getRecordValue(exercise: Exercise): number {
    if (exercise.weightKg && exercise.reps) {
      return exercise.weightKg * exercise.reps; // Volume
    } else if (exercise.weightKg) {
      return exercise.weightKg;
    } else if (exercise.reps) {
      return exercise.reps;
    } else if (exercise.durationMinutes) {
      return exercise.durationMinutes;
    } else if (exercise.distanceKm) {
      return exercise.distanceKm;
    }
    return exercise.points;
  }

  private async updateUserTotalPoints(userId: string): Promise<void> {
    const result = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .select('SUM(exercise.points)', 'total')
      .where('exercise.userId = :userId', { userId })
      .getRawOne();

    const totalPoints = parseInt(result?.total || '0');
    await this.userRepository.update(userId, { totalPoints });
  }

  private getDateFilter(period: 'week' | 'month' | 'year'): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private formatExerciseResponse(exercise: Exercise): ExerciseResponse {
    return {
      id: exercise.id,
      userId: exercise.userId,
      workoutId: exercise.workoutId,
      nameEn: exercise.nameEn,
      nameHe: exercise.nameHe,
      type: exercise.type,
      category: exercise.category,
      sets: exercise.sets,
      reps: exercise.reps,
      weightKg: exercise.weightKg,
      durationMinutes: exercise.durationMinutes,
      distanceKm: exercise.distanceKm,
      calories: exercise.calories,
      intensity: exercise.intensity,
      notes: exercise.notes,
      points: exercise.points,
      timestamp: exercise.timestamp.toISOString(),
      isPersonalRecord: exercise.isPersonalRecord
    };
  }

  private formatWorkoutResponse(workout: Workout): WorkoutResponse {
    return {
      id: workout.id,
      userId: workout.userId,
      startTime: workout.startTime.toISOString(),
      endTime: workout.endTime?.toISOString() || null,
      totalPoints: workout.totalPoints,
      totalExercises: workout.totalExercises,
      duration: workout.duration,
      exercises: workout.exercises?.map(ex => this.formatExerciseResponse(ex)) || []
    };
  }

  private formatPersonalRecordResponse(record: PersonalRecord): PersonalRecordResponse {
    return {
      id: record.id,
      userId: record.userId,
      exerciseType: record.exerciseType,
      recordType: record.recordType,
      value: record.value,
      achievedAt: record.achievedAt.toISOString(),
      exercise: record.exercise ? this.formatExerciseResponse(record.exercise) : null
    };
  }
}