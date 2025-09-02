import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../../users/entities/user.entity';
import { Payment } from './payment.entity';

export enum TransactionType {
  PAYMENT = 'payment',
  ESCROW_FUNDING = 'escrow_funding',
  ESCROW_RELEASE = 'escrow_release',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  FEE = 'fee',
  BONUS = 'bonus',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

@ObjectType()
@Entity('transactions')
export class Transaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Payment, { nullable: true })
  @ManyToOne(() => Payment, payment => payment.transactions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Field({ nullable: true })
  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => TransactionType)
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Field(() => Int)
  @Column()
  amount: number;

  @Field()
  @Column({ default: 'USD' })
  currency: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'balance_after', nullable: true })
  balanceAfter: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field(() => Date)
  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Virtual fields
  @Field(() => String)
  formattedAmount: string;

  @Field(() => String)
  formattedBalanceAfter: string;
}