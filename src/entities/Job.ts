import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Coordinates, TimeWindow } from '../types/optimization.types';
import { Technician } from './Technician';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  client_ref?: string;

  @Column()
  address!: string;

  @Column('jsonb')
  coordinates!: Coordinates;

  @Column('jsonb')
  time_window!: TimeWindow;

  @Column({ type: 'integer' })
  service_time!: number;  // in minutes

  @Column({ type: 'integer', default: 3 })
  priority!: number;  // 1-5, default medium priority

  @Column()
  job_type!: string;

  @ManyToOne(() => Technician, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  technician?: Technician;

  @Column({ nullable: true })
  technician_id?: string;

  @Column({ type: 'enum', enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'], default: 'pending' })
  status!: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Column({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
} 