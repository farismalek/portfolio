import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CompanyProfile } from './company-profile.entity';
import { JobListing } from '../../jobs/entities/job-listing.entity';

@ObjectType()
@Entity('company_departments')
export class CompanyDepartment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CompanyProfile)
  @ManyToOne(() => CompanyProfile, company => company.departments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field()
  @Column({ name: 'company_id' })
  companyId: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => JobListing, job => job.department)
  jobs: JobListing[];

  @Field(() => Number)
  jobCount: number;
}