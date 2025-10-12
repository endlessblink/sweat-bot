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
@Index(['userId'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Basic info
  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  nameHe: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  descriptionHe: string;

  @Column({ length: 100 })
  category: 'consistency' | 'performance' | 'strength' | 'endurance' | 'weight_loss';

  // Target details
  @Column({ length: 100 })
  targetType: 'sessions' | 'reps' | 'distance' | 'weight' | 'duration' | 'calories';

  @Column()
  targetValue: number;

  @Column({ length: 50 })
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';

  // Gamification
  @Column({ default: 0 })
  pointsReward: number;

  @Column({ default: true })
  isActive: boolean;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.goals)
  user: User;
}