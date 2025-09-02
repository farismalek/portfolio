import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { PostHashtag } from './post-hashtag.entity';

@ObjectType()
@Entity('hashtags')
export class Hashtag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field(() => Int)
  @Column({ name: 'post_count', default: 0 })
  postCount: number;

  @Field(() => [PostHashtag], { nullable: true })
  @OneToMany(() => PostHashtag, postHashtag => postHashtag.hashtag)
  postHashtags: PostHashtag[];

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}