import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Profile } from '../../profiles/entities/profile.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { Post } from '../../posts/entities/post.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { FeedPreference } from '../../feed/entities/feed-preference.entity';
import { Group } from '../../groups/entities/group.entity';
import { GroupMembership } from '../../groups/entities/group-membership.entity';
import { Bookmark } from '../../bookmarks/entities/bookmark.entity';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column({ unique: true })
  username: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Field(() => Boolean)
  @Column({ default: false })
  emailVerified: boolean;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  auth0Id: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Profile])
  @OneToMany(() => Profile, (profile) => profile.user)
  profiles: Profile[];

  @Field(() => [Portfolio])
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];

  @Field(() => [Post])
  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @Field(() => [Notification])
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @Field(() => [Group])
  @OneToMany(() => Group, (group) => group.creator)
  createdGroups: Group[];

  @Field(() => [GroupMembership])
  @OneToMany(() => GroupMembership, (membership) => membership.user)
  groupMemberships: GroupMembership[];

  @Field(() => [Bookmark])
  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];

  @Field(() => FeedPreference, { nullable: true })
  @OneToOne(() => FeedPreference)
  feedPreference: FeedPreference;

  // Virtual field for full name
  @Field()
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username;
  }
}