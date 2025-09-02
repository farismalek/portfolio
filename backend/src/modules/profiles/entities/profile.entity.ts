import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('profiles')
export class Profile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  bio: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website: string;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true })
  skills: string[];

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  education: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  experience: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  socialLinks: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatarUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  coverUrl: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isDefault: boolean;

  @Field(() => User)
  @ManyToOne(() => User, user => user.profiles)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field()
  @Column()
  userId: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  // Social stats
  @Field(() => Int)
  @Column({ name: 'follower_count', default: 0 })
  followerCount: number;

  @Field(() => Int)
  @Column({ name: 'following_count', default: 0 })
  followingCount: number;

  @Field(() => Int)
  @Column({ name: 'connection_count', default: 0 })
  connectionCount: number;

  @Field(() => Int)
  @Column({ name: 'post_count', default: 0 })
  postCount: number;
}