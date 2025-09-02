import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { FreelancerProfile } from './freelancer-profile.entity';

@ObjectType()
@Entity('freelancer_portfolio_items')
export class FreelancerPortfolioItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => FreelancerProfile)
  @ManyToOne(() => FreelancerProfile, profile => profile.portfolioItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'freelancer_id' })
  freelancer: FreelancerProfile;

  @Field()
  @Column({ name: 'freelancer_id' })
  freelancerId: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ name: 'project_url', nullable: true })
  projectUrl: string;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'image_urls', type: 'text', array: true, nullable: true })
  imageUrls: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'text', array: true, nullable: true })
  skills: string[];

  @Field({ nullable: true })
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Field({ nullable: true })
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}