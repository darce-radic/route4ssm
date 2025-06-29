import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Coordinates, TimeWindow } from '../types/optimization.types';

@Entity()
export class Technician {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  home_address!: string;

  @Column('jsonb')
  home_coordinates!: Coordinates;

  @Column('jsonb')
  working_hours!: TimeWindow;

  @Column('simple-array')
  skills!: string[];

  @Column({ type: 'integer', nullable: true })
  max_jobs_per_day!: number | null;

  @Column({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Column({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Column({ default: true })
  is_active!: boolean;
} 