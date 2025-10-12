import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Workout } from './Workout';
import { Achievement } from './Achievement';
import { PersonalRecord } from './PersonalRecord';
import { Goal } from './Goal';
import { GamificationStats } from './GamificationStats';

@Entity()
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hashedPassword: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullNameHe: string | null;

  // Profile
  @Column({ type: 'integer', nullable: true })
  age: number | null;

  @Column({ type: 'float', nullable: true })
  weightKg: number | null;

  @Column({ type: 'float', nullable: true })
  heightCm: number | null;

  @Column({ type: 'varchar', length: 50, default: 'beginner' })
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';

  @Column({ type: 'varchar', length: 10, default: 'he' })
  preferredLanguage: 'he' | 'en';

  // Gamification
  @Column({ type: 'integer', default: 0 })
  totalPoints: number;

  // Settings
  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  notificationSettings: Record<string, any>;

  // Status
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isGuest: boolean;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: 'user' | 'admin' | 'premium_user';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  // Relationships
  @OneToMany(() => Workout, workout => workout.user, { cascade: true })
  workouts: Workout[];

  @OneToMany(() => Achievement, achievement => achievement.user, { cascade: true })
  achievements: Achievement[];

  @OneToMany(() => PersonalRecord, personalRecord => personalRecord.user, { cascade: true })
  personalRecords: PersonalRecord[];

  @OneToMany(() => Goal, goal => goal.user, { cascade: true })
  goals: Goal[];

  @OneToMany(() => GamificationStats, gamificationStats => gamificationStats.user, { cascade: true })
  gamificationStats: GamificationStats[];
}