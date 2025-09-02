import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../../users/entities/user.entity';
import { Contract } from './contract.entity';

@ObjectType()
@Entity('contract_time_logs')
export class ContractTimeLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Contract)
  @ManyToOne(() => Contract, contract => contract.timeLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Field()
  @Column({ name: 'contract_id' })
  contractId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'freelancer_id' })
  freelancer: User;

  @Field()
  @Column({ name: 'freelancer_id' })
  freelancerId: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field(() => Date)
  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  @Field(() => Date)
  @Column({ name: 'end_time', type: 'timestamp with time zone' })
  endTime: Date;

  @Field(() => Int)
  @Column()
  duration: number; // in minutes

  @Field(() => Boolean)
  @Column({ name: 'is_billable', default: true })
  isBillable: boolean;

  @Field(() => Boolean, { nullable: true })
  @Column({ name: 'is_approved', nullable: true })
  isApproved: boolean;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'approved_by', nullable: true })
  approvedById: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'approved_at', nullable: true, type: 'timestamp with time zone' })
  approvedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'rejected_at', nullable: true, type: 'timestamp with time zone' })
  rejectedAt: Date;

  @Field({ nullable: true })
  @Column({ name: 'rejection_reason', nullable: true, type: 'text' })
  rejectionReason: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Virtual fields
  @Field(() => String)
  formattedDuration: string;

  @Field(() => Int)
  billableAmount: number;

  @Field(() => String)
  formattedAmount: string;
}