import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { CompanyProfile } from '../../companies/entities/company-profile.entity';
import { ProjectProposal } from './project-proposal.entity';
import { Contract } from '../contracts/entities/contract.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectDuration {
  LESS_THAN_1_MONTH = 'less_than_1_month',
  ONE_TO_3_MONTHS = '1_to_3_months',
  THREE_TO_6_MONTHS = '3_to_6_months',
  MORE_THAN_6_MONTHS = 'more_than_6_months',
}

export enum ProjectComplexity {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

export enum BudgetType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  TO_BE_DETERMINED = 'to_be_determined',
}

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
});

registerEnumType(ProjectDuration, {
  name: 'ProjectDuration',
});

registerEnumType(ProjectComplexity, {
  name: 'ProjectComplexity',
});

registerEnumType(BudgetType, {
  name: 'BudgetType',
});

@ObjectType()
@Entity('freelance_projects')
export class FreelanceProject {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Field()
  @Column({ name: 'client_id' })
  clientId: string;

  @Field(() => CompanyProfile, { nullable: true })
  @ManyToOne(() => CompanyProfile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field({ nullable: true })
  @Column({ name: 'company_id', nullable: true })
  companyId: string;

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

  @Field(() => [String])
  @Column({ type: 'text', array: true })
  skills: string[];

  @Field()
  @Column()
  category: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subcategory: string;

  @Field(() => ProjectStatus)
  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Field(() => ProjectDuration, { nullable: true })
  @Column({
    type: 'enum',
    enum: ProjectDuration,
    nullable: true,
  })
  duration: ProjectDuration;

  @Field(() => ProjectComplexity)
  @Column({
    type: 'enum',
    enum: ProjectComplexity,
    default: ProjectComplexity.INTERMEDIATE,
  })
  complexity: ProjectComplexity;

  @Field(() => BudgetType)
  @Column({
    name: 'budget_type',
    type: 'enum',
    enum: BudgetType,
    default: BudgetType.FIXED,
  })
  budgetType: BudgetType;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'budget_amount', nullable: true })
  budgetAmount: number;

  @Field({ nullable: true })
  @Column({ name: 'budget_currency', default: 'USD' })
  budgetCurrency: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'budget_min_hourly', nullable: true })
  budgetMinHourly: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'budget_max_hourly', nullable: true })
  budgetMaxHourly: number;

  @Field()
  @Column({ default: 'public' })
  visibility: string;

  @Field(() => Boolean)
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'published_at', nullable: true, type: 'timestamp with time zone' })
  publishedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'deadline', nullable: true, type: 'timestamp with time zone' })
  deadline: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => Int)
  @Column({ name: 'proposal_count', default: 0 })
  proposalCount: number;

  @Field(() => Int)
  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'attachment_urls', type: 'text', array: true, nullable: true })
  attachmentUrls: string[];

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @OneToMany(() => ProjectProposal, proposal => proposal.project)
  proposals: ProjectProposal[];

  @OneToMany(() => Contract, contract => contract.project)
  contracts: Contract[];

  // Virtual fields
  @Field(() => String, { nullable: true })
  formattedBudget: string;

  @Field(() => Int)
  daysSincePosted: number;

  @Field(() => Boolean)
  hasProposed: boolean;
}