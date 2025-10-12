import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { Workout } from './Workout';
import { User } from './User';

@Entity()
@Index(['userId'])
@Index(['workoutId'])
@Index(['nameEn'])
@Index(['timestamp'])
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  workoutId: string;

  // Exercise info
  @Column({ length: 100 })
  nameEn: string;

  @Column({ length: 100, nullable: true })
  nameHe: string;

  @Column({ length: 50 })
  type: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports' | 'other';

  @Column({ length: 50, nullable: true })
  category: string;

  // Performance data
  @Column({ nullable: true })
  sets: number;

  @Column({ nullable: true })
  reps: number;

  @Column({ type: 'float', nullable: true })
  weightKg: number;

  @Column({ type: 'float', nullable: true })
  distanceKm: number;

  @Column({ type: 'float', nullable: true })
  durationMinutes: number;

  // Metrics
  @Column({ nullable: true })
  calories: number;

  @Column({ type: 'float', default: 0 })
  points: number;

  @Column({ length: 20, nullable: true })
  intensity: 'low' | 'medium' | 'high';

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Timing
  @CreateDateColumn()
  timestamp: Date;

  // Personal record flag
  @Column({ default: false })
  isPersonalRecord: boolean;

  // Relationships
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Workout, workout => workout.exercises)
  workout: Workout;
}