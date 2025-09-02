import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { JobListing } from './job-listing.entity';

@ObjectType()
@Entity('job_saved')
export class JobSaved {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => JobListing)
  @ManyToOne(() => JobListing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: JobListing;

  @Field()
  @Column({ name: 'job_id' })
  jobId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Date)
  @Column({ name: 'saved_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  savedAt: Date;
}