import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

export enum ParticipantRole {
  MEMBER = 'member',
  ADMIN = 'admin',
}

registerEnumType(ParticipantRole, {
  name: 'ParticipantRole',
});

@ObjectType()
@Entity('conversation_participants')
export class ConversationParticipant {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation, conversation => conversation.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Field()
  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => ParticipantRole)
  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  @Field(() => Date)
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Field(() => Date)
  @Column({ name: 'last_read_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  lastReadAt: Date;

  @Field(() => Boolean)
  @Column({ name: 'is_muted', default: false })
  isMuted: boolean;

  @Field(() => Boolean)
  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;
}