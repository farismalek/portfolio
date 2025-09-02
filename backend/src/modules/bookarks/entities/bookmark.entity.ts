import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';

@ObjectType()
@Entity('bookmarks')
export class Bookmark {
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

  @Field(() => Post, { nullable: true })
  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Field({ nullable: true })
  @Column({ name: 'post_id', nullable: true })
  postId: string;

  @Field(() => Portfolio, { nullable: true })
  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Field({ nullable: true })
  @Column({ name: 'portfolio_id', nullable: true })
  portfolioId: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}