import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

registerEnumType(ConversationType, {
  name: 'ConversationType',
});

@ObjectType()
@Entity('conversations')
export class Conversation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ConversationType)
  @Column({
    type: 'enum',
    enum: ConversationType,
    name: 'type',
  })
  type: ConversationType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  title: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Field()
  @Column({ name: 'created_by' })
  createdById: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => Date)
  @Column({ name: 'last_message_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  lastMessageAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => [ConversationParticipant])
  @OneToMany(() => ConversationParticipant, participant => participant.conversation)
  participants: ConversationParticipant[];

  @Field(() => [Message])
  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  // Virtual fields
  @Field(() => Message, { nullable: true })
  lastMessage: Message;

  @Field(() => Number)
  unreadCount: number;
}