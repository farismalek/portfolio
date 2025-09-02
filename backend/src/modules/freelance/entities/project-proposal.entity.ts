import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { FreelanceProject } from './freelance-project.entity';
import { Contract } from '../contracts/entities/contract.entity';

export enum ProposalStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@ObjectType()
@Entity('project_proposals')
export class ProjectProposal {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => FreelanceProject)
  @ManyToOne(() => FreelanceProject, project => project.proposals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: FreelanceProject;

  @Field()
  @Column({ name: 'project_id' })
  projectId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'freelancer_id' })
  freelancer: User;

  @Field()
  @Column({ name: 'freelancer_id' })
  freelancerId: string;

  @Field()
  @Column({ name: 'cover_letter', type: 'text' })
  coverLetter: string;

  @Field(() => Int)
  @Column({ name: 'payment_amount' })
  paymentAmount: number;

  @Field()
  @Column({ name: 'payment_currency', default: 'USD' })
  paymentCurrency: string;

  @Field()
  @Column({ name: 'payment_type', default: 'fixed' })
  paymentType: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration: number;

  @Field({ nullable: true })
  @Column({ name: 'duration_unit', default: 'days' })
  durationUnit: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  @Field(() => Date)
  @Column({ name: 'submitted_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'attachment_urls', type: 'text', array: true, nullable: true })
  attachmentUrls: string[];

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToOne(() => Contract, contract => contract.proposal)
  contract: Contract;

  // Virtual fields
  @Field(() => String)
  formattedPayment: string;

  @Field(() => Int)
  daysSinceSubmitted: number;
}