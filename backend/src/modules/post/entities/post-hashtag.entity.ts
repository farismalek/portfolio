import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Post } from '../../posts/post.entity';
import { Hashtag } from './hashtag.entity';

@ObjectType()
@Entity('post_hashtags')
export class PostHashtag {
  @PrimaryColumn({ name: 'post_id' })
  postId: string;

  @PrimaryColumn({ name: 'hashtag_id' })
  hashtagId: string;

  @Field(() => Post)
  @ManyToOne(() => Post, post => post.postHashtags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Field(() => Hashtag)
  @ManyToOne(() => Hashtag, hashtag => hashtag.postHashtags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hashtag_id' })
  hashtag: Hashtag;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}