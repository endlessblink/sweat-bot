import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { User } from './User';

@Entity()
@Index(['userId'], { unique: true })
@Index(['totalPoints'])
@Index(['currentLevel'])
export class GamificationStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  // Points and levels
  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 1 })
  currentLevel: number;

  @Column({ default: 0 })
  experiencePoints: number;

  @Column({ default: 100 })
  nextLevelXp: number;

  // Streaks
  @Column({ default: 0 })
  currentStreakDays: number;

  @Column({ default: 0 })
  longestStreakDays: number;

  @Column({ type: 'timestamp', nullable: true })
  lastWorkoutDate: Date;

  // Statistics
  @Column({ default: 0 })
  totalWorkouts: number;

  @Column({ default: 0 })
  totalExerciseCount: number;

  @Column({ default: 0 })
  totalCaloriesBurned: number;

  @Column({ type: 'float', default: 0 })
  totalWeightLiftedKg: number;

  @Column({ type: 'float', default: 0 })
  totalDistanceKm: number;

  @Column({ default: 0 })
  totalDurationMinutes: number;

  // Rankings
  @Column({ nullable: true })
  globalRank: number;

  @Column({ nullable: true })
  weeklyRank: number;

  @Column({ nullable: true })
  monthlyRank: number;

  // Social
  @Column({ default: 0 })
  friendsCount: number;

  @Column({ default: 0 })
  challengesCompleted: number;

  @Column({ default: 0 })
  challengesWon: number;

  // Timing
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.gamificationStats)
  user: User;
}