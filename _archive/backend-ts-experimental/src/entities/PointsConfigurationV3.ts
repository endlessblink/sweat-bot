/**
 * Points Configuration Entity v3
 * Unified configuration for exercises, rules, and achievements with JSONB storage
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity('points_configuration_v3')
@Index(['entityType', 'entityKey', 'isActive'])
@Index(['entityType', 'entityKey', 'version'])
export class PointsConfigurationV3 {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  entityType!: 'exercise' | 'rule' | 'achievement';

  @Column({ type: 'varchar', length: 100, name: 'entity_key' })
  entityKey!: string;

  @Column({ type: 'jsonb', name: 'config_data' })
  configData!: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'created_by' })
  createdBy?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
