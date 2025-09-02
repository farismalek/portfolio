import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Portfolio } from './portfolio.entity';

@ObjectType()
@Entity('portfolio_pages')
export class PortfolioPage {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  slug: string;

  @Field(() => Int)
  @Column()
  order: number;

  @Field(() => String)
  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, any>;

  @Field(() => Boolean)
  @Column({ default: false })
  isHomePage: boolean;

  @Field(() => Portfolio)
  @ManyToOne(() => Portfolio, portfolio => portfolio.pages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @Field()
  @Column()
  portfolioId: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}