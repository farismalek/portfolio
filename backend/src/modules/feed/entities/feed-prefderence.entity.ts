import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('feed_preferences')
export class FeedPreference {
  @Field(() => ID)
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'preferred_content_types', type: 'text', array: true, nullable: true })
  preferredContentTypes: string[];

  @Field(() => [String], { nullable: true })
  @Column({ name: 'hidden_users', type: 'uuid', array: true, nullable: true })
  hiddenUsers: string[];

  @Field(() => [String], { nullable: true })
  @Column({ name: 'prioritized_users', type: 'uuid', array: true, nullable: true })
  prioritizedUsers: string[];

  @Field(() => [String], { nullable: true })
  @Column({ name: 'hidden_tags', type: 'uuid', array: true, nullable: true })
  hiddenTags: string[];

  @Field(() => [String], { nullable: true })
  @Column({ name: 'prioritized_tags', type: 'uuid', array: true, nullable: true })
  prioritizedTags: string[];

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}