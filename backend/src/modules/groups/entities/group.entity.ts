import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { GroupMembership } from './group-membership.entity';
import { GroupPost } from './group-post.entity';

export enum GroupType {
  INTEREST = 'interest',
  PROFESSION = 'profession',
  COMPANY = 'company',
  EDUCATIONAL = 'educational',
  REGIONAL = 'regional',
}

export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SECRET = 'secret',
}

registerEnumType(GroupType, {
  name: 'GroupType',
});

registerEnumType(GroupVisibility, {
  name: 'GroupVisibility',
});

@ObjectType()
@Entity('groups')
export class Group {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => GroupType)
  @Column({
    type: 'enum',
    enum: GroupType,
    default: GroupType.INTEREST,
  })
  type: GroupType;

  @Field(() => GroupVisibility)
  @Column({
    type: 'enum',
    enum: GroupVisibility,
    default: GroupVisibility.PUBLIC,
  })
  visibility: GroupVisibility;

  @Field()
  @Column({ unique: true })
  slug: string;

  @Field({ nullable: true })
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Field({ nullable: true })
  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string;

  @Field(() => Int)
  @Column({ name: 'member_count', default: 0 })
  memberCount: number;

  @Field(() => Int)
  @Column({ name: 'post_count', default: 0 })
  postCount: number;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Field()
  @Column({ name: 'creator_id' })
  creatorId: string;

  @Field(() => [GroupMembership], { nullable: true })
  @OneToMany(() => GroupMembership, membership => membership.group)
  memberships: GroupMembership[];

  @Field(() => [GroupPost], { nullable: true })
  @OneToMany(() => GroupPost, groupPost => groupPost.group)
  groupPosts: GroupPost[];

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}