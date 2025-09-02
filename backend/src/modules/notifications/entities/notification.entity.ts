import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../posts/entities/comment.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';

export enum NotificationType {
  NEW_FOLLOWER = 'new_follower',
  CONNECTION_REQUEST = 'connection_request',
  CONNECTION_ACCEPTED = 'connection_accepted',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  COMMENT_REPLY = 'comment_reply',
  POST_SHARE = 'post_share',
  MENTION = 'mention',
  PORTFOLIO_VIEW = 'portfolio_view',
  JOB_APPLICATION = 'job_application',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
@Entity('notifications')
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Field({ nullable: true })
  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Field(() => Post, { nullable: true })
  @ManyToOne(() => Post, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Field({ nullable: true })
  @Column({ name: 'post_id', nullable: true })
  postId: string;

  @Field(() => Comment, { nullable: true })
  @ManyToOne(() => Comment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Field({ nullable: true })
  @Column({ name: 'comment_id', nullable: true })
  commentId: string;

  @Field(() => Portfolio, { nullable: true })
  @ManyToOne(() => Portfolio, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Field({ nullable: true })
  @Column({ name: 'portfolio_id', nullable: true })
  portfolioId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  message: string;

  @Field()
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}