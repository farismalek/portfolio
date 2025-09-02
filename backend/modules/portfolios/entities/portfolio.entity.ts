import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { PortfolioPage } from './portfolio-page.entity';

export enum PortfolioStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum PortfolioVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PASSWORD_PROTECTED = 'password_protected',
}

@ObjectType()
@Entity('portfolios')
export class Portfolio {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: PortfolioStatus,
    default: PortfolioStatus.DRAFT,
  })
  status: PortfolioStatus;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: PortfolioVisibility,
    default: PortfolioVisibility.PUBLIC,
  })
  visibility: PortfolioVisibility;

  @Field({ nullable: true })
  @Column({ nullable: true })
  password: string;

  @Field()
  @Column()
  slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  customDomain: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnailUrl: string;

  @Field()
  @Column()
  templateId: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  customizations: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  settings: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  analytics: Record<string, any>;

  @Field(() => Boolean)
  @Column({ default: false })
  featured: boolean;

  @Field(() => User)
  @ManyToOne(() => User, user => user.portfolios)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field()
  @Column()
  userId: string;

  @Field(() => [PortfolioPage])
  @OneToMany(() => PortfolioPage, page => page.portfolio, { cascade: true })
  pages: PortfolioPage[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ nullable: true })
  publishedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ nullable: true })
  lastViewedAt: Date;

  @Field(() => Number)
  @Column({ default: 0 })
  viewCount: number;
}