import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../../users/entities/user.entity';
import { Contract } from './contract.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

registerEnumType(MilestoneStatus, {
  name: 'MilestoneStatus',
});

@ObjectType()
@Entity('contract_milestones')
export class ContractMilestone {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Contract)
  @ManyToOne(() => Contract, contract => contract.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Field()
  @Column({ name: 'contract_id' })
  contractId: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'due_date', nullable: true, type: 'timestamp with time zone' })
  dueDate: Date;

  @Field(() => Int)
  @Column()
  amount: number;

  @Field()
  @Column({ default: 'USD' })
  currency: string;

  @Field(() => MilestoneStatus)
  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Field(() => Int)
  @Column({ name: 'order_index' })
  orderIndex: number;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'in_progress_at', nullable: true, type: 'timestamp with time zone' })
  inProgressAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'submitted_at', nullable: true, type: 'timestamp with time zone' })
  submittedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'approved_at', nullable: true, type: 'timestamp with time zone' })
  approvedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'approved_by', nullable: true })
  approvedById: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'rejected_at', nullable: true, type: 'timestamp with time zone' })
  rejectedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejectedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'rejected_by', nullable: true })
  rejectedById: string;

  @Field({ nullable: true })
  @Column({ name: 'rejection_reason', nullable: true, type: 'text' })
  rejectionReason: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'attachment_urls', type: 'text', array: true, nullable: true })
  attachmentUrls: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  feedback: string;

  // Relationships
  @OneToMany(() => Payment, payment => payment.milestone)
  payments: Payment[];

  // Virtual fields
  @Field(() => String)
  formattedAmount: string;

  @Field(() => Boolean)
  isPaid: boolean;

  @Field(() => Int)
  daysUntilDue: number;

  @Field(() => Boolean)
  isOverdue: boolean;
}