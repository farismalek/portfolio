import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { JobListing } from './job-listing.entity';
import { JobApplicationStage } from './job-application-stage.entity';

export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  ASSESSMENT = 'assessment',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

registerEnumType(ApplicationStatus, {
  name: 'ApplicationStatus',
});

@ObjectType()
@Entity('job_applications')
export class JobApplication {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => JobListing)
  @ManyToOne(() => JobListing, job => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: JobListing;

  @Field()
  @Column({ name: 'job_id' })
  jobId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field({ nullable: true })
  @Column({ name: 'resume_url', nullable: true })
  resumeUrl: string;

  @Field({ nullable: true })
  @Column({ name: 'cover_letter', nullable: true, type: 'text' })
  coverLetter: string;

  @Field(() => ApplicationStatus)
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.SUBMITTED,
  })
  status: ApplicationStatus;

  @Field(() => Date)
  @Column({ name: 'applied_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;

  @Field(() => Date)
  @Column({ name: 'status_updated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  statusUpdatedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'status_updated_by' })
  statusUpdatedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'status_updated_by', nullable: true })
  statusUpdatedById: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Field(() => Number, { nullable: true })
  @Column({ name: 'salary_expectation', nullable: true })
  salaryExpectation: number;

  @Field({ nullable: true })
  @Column({ name: 'salary_currency', nullable: true, default: 'USD' })
  salaryCurrency: string;

  @Field({ nullable: true })
  @Column({ name: 'salary_period', nullable: true, default: 'yearly' })
  salaryPeriod: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'available_start_date', nullable: true, type: 'date' })
  availableStartDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  source: string;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, any>;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => [JobApplicationStage])
  @OneToMany(() => JobApplicationStage, stage => stage.application)
  stages: JobApplicationStage[];

  // Virtual fields
  @Field(() => Number)
  daysSinceApplied: number;
}