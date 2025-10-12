/**
 * Points Calculation Entity v3
 * Audit trail for all points calculations with full breakdown
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Exercise } from './Exercise';

@Entity('points_calculations_v3')
@Index(['userId', 'createdAt'])
@Index(['exerciseKey'])
export class PointsCalculationV3 {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'exercise_id' })
  exerciseId?: string;

  @Column({ type: 'varchar', length: 100, name: 'exercise_key' })
  exerciseKey!: string;

  @Column({ type: 'jsonb', name: 'calculation_data' })
  calculationData!: {
    breakdown: {
      basePoints: number;
      repsPoints: number;
      setsPoints: number;
      weightPoints: number;
      distancePoints: number;
      durationPoints: number;
      bonusPoints: number;
      multiplierValue: number;
      totalBeforeMultiplier: number;
      appliedBonuses: Array<{ id: string; name: string; value: number }>;
      appliedMultipliers: Array<{ id: string; name: string; value: number }>;
    };
    input: Record<string, any>;
  };

  @Column({ type: 'int', name: 'points_earned' })
  pointsEarned!: number;

  @Column({ type: 'jsonb', name: 'rules_applied' })
  rulesApplied!: string[];

  @Column({ type: 'int', name: 'configuration_version' })
  configurationVersion!: number;

  @Column({ type: 'float', nullable: true, name: 'calculation_time_ms' })
  calculationTimeMs?: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  // Optional relation to Exercise entity
  @ManyToOne(() => Exercise, { nullable: true })
  @JoinColumn({ name: 'exercise_id' })
  exercise?: Exercise;
}
