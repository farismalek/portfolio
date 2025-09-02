import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

@ObjectType()
@Entity('message_read_receipts')
export class MessageReadReceipt {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Message)
  @ManyToOne(() => Message, message => message.readReceipts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Field()
  @Column({ name: 'message_id' })
  messageId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Date)
  @Column({ name: 'read_at', type: 'timestamp with time zone' })
  readAt: Date;
}
