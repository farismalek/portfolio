import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../users/entities/user.entity';
import { Portfolio } from '../../../modules/portfolios/entities/portfolio.entity';
import { Reaction } from '../post/entities/reaction.entity';
import { Comment } from '../post/entities/comment.entity';
import { Share } from '../post/entities/share.entity';
import { PostHashtag } from '../post/entities/post-hashtag.entity';
import { GroupPost } from '../groups/entities/group-post.entity';

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  GALLERY = 'gallery',
  VIDEO = 'video',
  ARTICLE = 'article',
  PORTFOLIO = 'portfolio',
  PROJECT = 'project',
  JOB = 'job',
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum PostVisibility {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  PRIVATE = 'private',
}

registerEnumType(PostType, {
  name: 'PostType',
});

registerEnumType(PostStatus, {
  name: 'PostStatus',
});

registerEnumType(PostVisibility, {
  name: 'PostVisibility',
});

@ObjectType()
@Entity('posts')
export class Post {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => PostType)
  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.TEXT,
  })
  type: PostType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  content: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  media: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => PostStatus)
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PUBLISHED,
  })
  status: PostStatus;

  @Field(() => PostVisibility)
  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Field(() => Portfolio, { nullable: true })
  @ManyToOne(() => Portfolio, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Field({ nullable: true })
  @Column({ name: 'portfolio_id', nullable: true })
  portfolioId: string;

  @Field(() => Post, { nullable: true })
  @ManyToOne(() => Post, post => post.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Post;

  @Field({ nullable: true })
  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Field(() => [Post], { nullable: true })
  @OneToMany(() => Post, post => post.parent)
  replies: Post[];

  @Field(() => Int)
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Field(() => [Reaction], { nullable: true })
  @OneToMany(() => Reaction, reaction => reaction.post)
  reactions: Reaction[];

  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @Field(() => [Share], { nullable: true })
  @OneToMany(() => Share, share => share.post)
  shares: Share[];

  @Field(() => [PostHashtag], { nullable: true })
  @OneToMany(() => PostHashtag, postHashtag => postHashtag.post)
  postHashtags: PostHashtag[];

  @Field(() => [GroupPost], { nullable: true })
  @OneToMany(() => GroupPost, groupPost => groupPost.post)
  groupPosts: GroupPost[];

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;

  // Virtual fields for convenience
  @Field(() => Int)
  reactionCount: number;

  @Field(() => Int)
  commentCount: number;

  @Field(() => Int)
  shareCount: number;

  @Field(() => Boolean)
  hasUserReacted: boolean;
}