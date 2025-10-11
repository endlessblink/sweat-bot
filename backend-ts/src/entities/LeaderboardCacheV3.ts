/**
 * Leaderboard Cache Entity v3
 * Cached leaderboard data with TTL for fast queries
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique
} from 'typeorm';

@Entity('leaderboard_cache_v3')
@Unique(['periodType', 'userId'])
@Index(['periodType', 'rankPosition'])
@Index(['validUntil'])
export class LeaderboardCacheV3 {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, name: 'period_type' })
  periodType!: 'all_time' | 'weekly' | 'monthly' | 'daily';

  @Column({ type: 'varchar', length: 100, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  username!: string;

  @Column({ type: 'int', name: 'total_points' })
  totalPoints!: number;

  @Column({ type: 'int', name: 'rank_position' })
  rankPosition!: number;

  @Column({ type: 'int', nullable: true })
  level?: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'calculated_at' })
  calculatedAt!: Date;

  @Column({ type: 'timestamptz', name: 'valid_until' })
  validUntil!: Date;

  /**
   * Check if cache entry is still valid
   */
  get isValid(): boolean {
    return new Date() < this.validUntil;
  }
}
