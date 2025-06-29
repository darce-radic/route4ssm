import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { OptimizationRequest, OptimizationResult } from '../types/optimization.types';

@Entity()
export class OptimizationJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  request!: OptimizationRequest;

  @Column({ type: 'jsonb', nullable: true })
  result!: OptimizationResult | null;

  @Column({ type: 'float', nullable: true })
  progress!: number | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at!: Date | null;
} 