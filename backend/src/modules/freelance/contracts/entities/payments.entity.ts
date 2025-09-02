import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../../users/entities/user.entity';
import { CompanyProfile } from '../../../companies/entities/company-profile.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { ContractMilestone } from '../contracts/entities/contract-milestone.entity';
import { Transaction } from './transaction.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});

@ObjectType()
@Entity('payments')
export class Payment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Contract, { nullable: true })
  @ManyToOne(() => Contract, contract => contract.payments, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Field({ nullable: true })
  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @Field(() => ContractMilestone, { nullable: true })
  @ManyToOne(() => ContractMilestone, milestone => milestone.payments, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'milestone_id' })
  milestone: ContractMilestone;

  @Field({ nullable: true })
  @Column({ name: 'milestone_id', nullable: true })
  milestoneId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payer_id' })
  payer: User;

  @Field()
  @Column({ name: 'payer_id' })
  payerId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payee_id' })
  payee: User;

  @Field()
  @Column({ name: 'payee_id' })
  payeeId: string;

  @Field(() => CompanyProfile, { nullable: true })
  @ManyToOne(() => CompanyProfile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field({ nullable: true })
  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Field(() => Int)
  @Column()
  amount: number;

  @Field()
  @Column({ default: 'USD' })
  currency: string;

  @Field({ nullable: true })
  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;

  @Field({ nullable: true })
  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Field(() => PaymentStatus)
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field(() => Int)
  @Column({ name: 'fee_amount', default: 0 })
  feeAmount: number;

  @Field(() => Date)
  @Column({ name: 'initiated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  initiatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'processed_at', nullable: true, type: 'timestamp with time zone' })
  processedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'completed_at', nullable: true, type: 'timestamp with time zone' })
  completedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'failed_at', nullable: true, type: 'timestamp with time zone' })
  failedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'refunded_at', nullable: true, type: 'timestamp with time zone' })
  refundedAt: Date;

  @Field({ nullable: true })
  @Column({ name: 'failure_reason', nullable: true, type: 'text' })
  failureReason: string;

  @Field(() => Boolean)
  @Column({ name: 'is_escrow', default: false })
  isEscrow: boolean;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @OneToMany(() => Transaction, transaction => transaction.payment)
  transactions: Transaction[];

  // Virtual fields
  @Field(() => String)
  formattedAmount: string;

  @Field(() => String)
  formattedFee: string;

  @Field(() => String)
  statusLabel: string;
}