import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { User } from './User';
import { Exercise } from './Exercise';

@Entity()
@Index(['userId'])
@Index(['exerciseType'])
@Index(['achievedAt'])
export class PersonalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Exercise info
  @Column({ length: 50 })
  exerciseType: string;

  @Column({ length: 50 })
  recordType: string;

  // Record data
  @Column({ type: 'float' })
  value: number;

  // Timing
  @CreateDateColumn()
  achievedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.personalRecords)
  user: User;

  @ManyToOne(() => Exercise, { nullable: true })
  exercise: Exercise;
}