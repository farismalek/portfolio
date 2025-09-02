import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';
import { MessageReaction } from './message-reaction.entity';
import { MessageReadReceipt } from './message-read-receipt.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system',
  TASK = 'task',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

registerEnumType(MessageType, {
  name: 'MessageType',
});

registerEnumType(MessageStatus, {
  name: 'MessageStatus',
});

@ObjectType()
@Entity('messages')
export class Message {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Field()
  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Field({ nullable: true })
  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Field(() => Message, { nullable: true })
  @ManyToOne(() => Message, message => message.replies, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Message;

  @Field({ nullable: true })
  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Field(() => [Message], { nullable: true })
  @OneToMany(() => Message, message => message.parent)
  replies: Message[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  content: string;

  @Field(() => MessageType)
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  media: Record<string, any>;

  @Field(() => MessageStatus)
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Field(() => Boolean)
  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Field(() => Boolean)
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => [MessageReaction], { nullable: true })
  @OneToMany(() => MessageReaction, reaction => reaction.message)
  reactions: MessageReaction[];

  @Field(() => [MessageReadReceipt], { nullable: true })
  @OneToMany(() => MessageReadReceipt, receipt => receipt.message)
  readReceipts: MessageReadReceipt[];

  // Virtual fields
  @Field(() => Number)
  reactionCount: number;

  @Field(() => Boolean)
  isRead: boolean;
}