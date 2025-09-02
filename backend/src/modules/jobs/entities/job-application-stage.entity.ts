import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { JobApplication } from './job-application.entity';

@ObjectType()
@Entity('job_application_stages')
export class JobApplicationStage {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => JobApplication)
  @ManyToOne(() => JobApplication, application => application.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: JobApplication;

  @Field()
  @Column({ name: 'application_id' })
  applicationId: string;

  @Field()
  @Column({ name: 'stage_name' })
  stageName: string;

  @Field(() => Int)
  @Column({ name: 'stage_order', type: 'smallint' })
  stageOrder: number;

  @Field()
  @Column()
  status: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'scheduled_at', nullable: true, type: 'timestamp with time zone' })
  scheduledAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'completed_at', nullable: true, type: 'timestamp with time zone' })
  completedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  feedback: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true, type: 'smallint' })
  rating: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Field({ nullable: true })
  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'updated_by', nullable: true })
  updatedById: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}