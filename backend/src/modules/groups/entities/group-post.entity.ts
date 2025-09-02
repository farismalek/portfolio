import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Group } from './group.entity';
import { Post } from '../../posts/entities/post.entity';

@ObjectType()
@Entity('group_posts')
export class GroupPost {
  @PrimaryColumn({ name: 'post_id' })
  postId: string;

  @PrimaryColumn({ name: 'group_id' })
  groupId: string;

  @Field(() => Post)
  @ManyToOne(() => Post, post => post.groupPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Field(() => Group)
  @ManyToOne(() => Group, group => group.groupPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}