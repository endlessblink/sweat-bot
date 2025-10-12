import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { User } from './User';

@Entity()
@Index(['userId'])
@Index(['achievementType'])
@Index(['earnedAt'])
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Achievement info
  @Column({ length: 50 })
  achievementType: 'badge' | 'milestone' | 'streak';

  @Column({ length: 100 })
  achievementName: string;

  @Column({ length: 100, nullable: true })
  achievementNameHe: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  descriptionHe: string;

  // Achievement data
  @Column({ length: 50, nullable: true })
  category: 'strength' | 'endurance' | 'consistency' | 'variety';

  @Column({ length: 20, nullable: true })
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';

  @Column({ default: 0 })
  pointsAwarded: number;

  // Progress
  @Column({ default: 0 })
  currentProgress: number;

  @Column({ nullable: true })
  targetProgress: number;

  @Column({ default: false })
  isCompleted: number;

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  earnedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.achievements)
  user: User;
}