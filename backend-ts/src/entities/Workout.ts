import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index
} from 'typeorm';
import { User } from './User';
import { Exercise } from './Exercise';

@Entity()
@Index(['userId'])
@Index(['startTime'])
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Timing
  @CreateDateColumn()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'integer', default: 0 })
  duration: number;

  // Workout details
  @Column({ length: 50, nullable: true })
  workoutType: 'strength' | 'cardio' | 'hiit' | 'crossfit' | 'general';

  @Column({ length: 255, nullable: true })
  workoutName: string;

  @Column({ length: 255, nullable: true })
  workoutNameHe: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Metrics
  @Column({ default: 0 })
  totalExercises: number;

  @Column({ default: 0 })
  totalReps: number;

  @Column({ type: 'float', default: 0 })
  totalWeightKg: number;

  @Column({ default: 0 })
  totalCalories: number;

  @Column({ default: 0 })
  totalPoints: number;

  // Status
  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'float', default: 0 })
  completionRate: number;

  // Relationships
  @ManyToOne(() => User, user => user.workouts)
  user: User;

  @OneToMany(() => Exercise, exercise => exercise.workout, { cascade: true })
  exercises: Exercise[];
}