/**
 * User Achievement Entity v3
 * Tracks achievements earned by users
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique
} from 'typeorm';

@Entity('user_achievements_v3')
@Unique(['userId', 'achievementId'])
@Index(['userId'])
export class UserAchievementV3 {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 100, name: 'achievement_id' })
  achievementId!: string;

  @Column({ type: 'varchar', length: 200, name: 'achievement_name' })
  achievementName!: string;

  @Column({ type: 'varchar', length: 200, name: 'achievement_name_he' })
  achievementNameHe!: string;

  @Column({ type: 'int', name: 'points_awarded' })
  pointsAwarded!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'earned_at' })
  earnedAt!: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'extra_data' })
  extraData?: Record<string, any>;
}
