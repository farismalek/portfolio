import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { FreelancerPortfolioItem } from './freelancer-portfolio-item.entity';
import { FreelancerService } from './freelancer-service.entity';

@ObjectType()
@Entity('freelancer_profiles')
export class FreelancerProfile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ type: 'text' })
  description: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'hourly_rate', nullable: true })
  hourlyRate: number;

  @Field({ nullable: true })
  @Column({ default: 'USD' })
  currency: string;

  @Field(() => [String])
  @Column({ type: 'text', array: true })
  skills: string[];

  @Field(() => [String])
  @Column({ type: 'text', array: true })
  categories: string[];

  @Field({ nullable: true })
  @Column({ default: 'full_time' })
  availability: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'available_hours_per_week', nullable: true })
  availableHoursPerWeek: number;

  @Field(() => Boolean)
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @OneToMany(() => FreelancerPortfolioItem, item => item.freelancer)
  portfolioItems: FreelancerPortfolioItem[];

  @OneToMany(() => FreelancerService, service => service.freelancer)
  services: FreelancerService[];

  // Virtual fields
  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  completedProjects: number;

  @Field(() => String)
  formattedHourlyRate: string;
}