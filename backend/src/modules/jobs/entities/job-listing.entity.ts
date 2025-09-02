import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { CompanyProfile } from '../../companies/entities/company-profile.entity';
import { CompanyDepartment } from '../../companies/entities/company-department.entity';
import { CompanyLocation } from '../../companies/entities/company-location.entity';
import { JobSkill } from './job-skill.entity';
import { JobApplication } from './job-application.entity';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  INTERNSHIP = 'internship',
  VOLUNTEER = 'volunteer',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  ASSOCIATE = 'associate',
  MID_LEVEL = 'mid_level',
  SENIOR = 'senior',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive',
}

export enum RemotePolicy {
  ONSITE = 'onsite',
  HYBRID = 'hybrid',
  REMOTE = 'remote',
  FLEXIBLE = 'flexible',
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  FILLED = 'filled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

registerEnumType(EmploymentType, {
  name: 'EmploymentType',
});

registerEnumType(ExperienceLevel, {
  name: 'ExperienceLevel',
});

registerEnumType(RemotePolicy, {
  name: 'RemotePolicy',
});

registerEnumType(JobStatus, {
  name: 'JobStatus',
});

@ObjectType()
@Entity('job_listings')
export class JobListing {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CompanyProfile)
  @ManyToOne(() => CompanyProfile, company => company.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field()
  @Column({ name: 'company_id' })
  companyId: string;

  @Field(() => CompanyDepartment, { nullable: true })
  @ManyToOne(() => CompanyDepartment, department => department.jobs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: CompanyDepartment;

  @Field({ nullable: true })
  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @Field(() => CompanyLocation, { nullable: true })
  @ManyToOne(() => CompanyLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: CompanyLocation;

  @Field({ nullable: true })
  @Column({ name: 'location_id', nullable: true })
  locationId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'posted_by' })
  postedBy: User;

  @Field()
  @Column({ name: 'posted_by' })
  postedById: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  slug: string;

  @Field()
  @Column({ type: 'text' })
  description: string;

  @Field({ nullable: true })
  @Column({ name: 'short_description', nullable: true })
  shortDescription: string;

  @Field(() => EmploymentType)
  @Column({
    type: 'enum',
    enum: EmploymentType,
    name: 'employment_type',
  })
  employmentType: EmploymentType;

  @Field(() => ExperienceLevel)
  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    name: 'experience_level',
  })
  experienceLevel: ExperienceLevel;

  @Field(() => RemotePolicy)
  @Column({
    type: 'enum',
    enum: RemotePolicy,
    name: 'remote_policy',
    default: RemotePolicy.ONSITE,
  })
  remotePolicy: RemotePolicy;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'min_salary', nullable: true, type: 'integer' })
  minSalary: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'max_salary', nullable: true, type: 'integer' })
  maxSalary: number;

  @Field({ nullable: true })
  @Column({ name: 'salary_currency', nullable: true, default: 'USD' })
  salaryCurrency: string;

  @Field({ nullable: true })
  @Column({ name: 'salary_period', nullable: true, default: 'yearly' })
  salaryPeriod: string;

  @Field(() => Boolean)
  @Column({ name: 'show_salary', default: false })
  showSalary: boolean;

  @Field({ nullable: true })
  @Column({ name: 'application_url', nullable: true })
  applicationUrl: string;

  @Field({ nullable: true })
  @Column({ name: 'application_instructions', nullable: true, type: 'text' })
  applicationInstructions: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'application_deadline', nullable: true, type: 'timestamp with time zone' })
  applicationDeadline: Date;

  @Field(() => JobStatus)
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'published_at', nullable: true, type: 'timestamp with time zone' })
  publishedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'expired_at', nullable: true, type: 'timestamp with time zone' })
  expiredAt: Date;

  @Field(() => Boolean)
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => Int)
  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Field(() => Int)
  @Column({ name: 'applications_count', default: 0 })
  applicationsCount: number;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @Field(() => [JobSkill])
  @OneToMany(() => JobSkill, skill => skill.job)
  skills: JobSkill[];

  @OneToMany(() => JobApplication, application => application.job)
  applications: JobApplication[];

  // Virtual fields
  @Field(() => Boolean)
  hasApplied: boolean;

  @Field(() => Boolean)
  hasSaved: boolean;

  @Field(() => String, { nullable: true })
  formattedSalary: string;

  @Field(() => Int)
  daysSincePosted: number;
}