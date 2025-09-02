import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('job_alerts')
export class JobAlert {
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

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  keywords: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location: string;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'employment_types', type: 'text', array: true, nullable: true })
  employmentTypes: string[];

  @Field(() => [String], { nullable: true })
  @Column({ name: 'experience_levels', type: 'text', array: true, nullable: true })
  experienceLevels: string[];

  @Field(() => [String], { nullable: true })
  @Column({ name: 'remote_policies', type: 'text', array: true, nullable: true })
  remotePolicies: string[];

  @Field(() => Number, { nullable: true })
  @Column({ name: 'min_salary', nullable: true })
  minSalary: number;

  @Field()
  @Column({ default: 'daily' })
  frequency: string;

  @Field(() => Boolean)
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'last_sent_at', nullable: true, type: 'timestamp with time zone' })
  lastSentAt: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}