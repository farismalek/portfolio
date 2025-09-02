import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../../users/entities/user.entity';
import { CompanyProfile } from '../../../companies/entities/company-profile.entity';
import { FreelanceProject } from '../../entities/freelance-project.entity';
import { ProjectProposal } from '../../entities/project-proposal.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractTimeLog } from './contract-time-log.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum ContractType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  RETAINER = 'retainer',
}

registerEnumType(ContractStatus, {
  name: 'ContractStatus',
});

registerEnumType(ContractType, {
  name: 'ContractType',
});

@ObjectType()
@Entity('contracts')
export class Contract {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => FreelanceProject, { nullable: true })
  @ManyToOne(() => FreelanceProject, project => project.contracts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: FreelanceProject;

  @Field({ nullable: true })
  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Field(() => ProjectProposal, { nullable: true })
  @OneToOne(() => ProjectProposal, proposal => proposal.contract, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'proposal_id' })
  proposal: ProjectProposal;

  @Field({ nullable: true })
  @Column({ name: 'proposal_id', nullable: true })
  proposalId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Field()
  @Column({ name: 'client_id' })
  clientId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'freelancer_id' })
  freelancer: User;

  @Field()
  @Column({ name: 'freelancer_id' })
  freelancerId: string;

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

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field(() => ContractType)
  @Column({
    name: 'contract_type',
    type: 'enum',
    enum: ContractType,
    default: ContractType.FIXED,
  })
  contractType: ContractType;

  @Field(() => ContractStatus)
  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'start_date', nullable: true, type: 'timestamp with time zone' })
  startDate: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'end_date', nullable: true, type: 'timestamp with time zone' })
  endDate: Date;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'total_amount', nullable: true })
  totalAmount: number;

  @Field({ nullable: true })
  @Column({ nullable: true, default: 'USD' })
  currency: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'hourly_rate', nullable: true })
  hourlyRate: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'weekly_limit', nullable: true })
  weeklyLimit: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  terms: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'signed_by_client_at', nullable: true, type: 'timestamp with time zone' })
  signedByClientAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'signed_by_freelancer_at', nullable: true, type: 'timestamp with time zone' })
  signedByFreelancerAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'completed_at', nullable: true, type: 'timestamp with time zone' })
  completedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamp with time zone' })
  cancelledAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledBy: User;

  @Field({ nullable: true })
  @Column({ name: 'cancelled_by', nullable: true })
  cancelledById: string;

  @Field({ nullable: true })
  @Column({ name: 'cancellation_reason', nullable: true, type: 'text' })
  cancellationReason: string;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'attachment_urls', type: 'text', array: true, nullable: true })
  attachmentUrls: string[];

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @Field(() => [ContractMilestone])
  @OneToMany(() => ContractMilestone, milestone => milestone.contract)
  milestones: ContractMilestone[];

  @Field(() => [ContractTimeLog])
  @OneToMany(() => ContractTimeLog, timeLog => timeLog.contract)
  timeLogs: ContractTimeLog[];

  @Field(() => [Payment])
  @OneToMany(() => Payment, payment => payment.contract)
  payments: Payment[];

  // Virtual fields
  @Field(() => String)
  formattedValue: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Boolean)
  isSigned: boolean;

  @Field(() => Int)
  completionPercentage: number;

  @Field(() => Int)
  remainingAmount: number;

  @Field(() => Int)
  paidAmount: number;
}