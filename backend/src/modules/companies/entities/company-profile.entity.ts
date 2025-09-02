import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { CompanyAdmin } from './company-admin.entity';
import { CompanyVerificationDocument } from './company-verification-document.entity';
import { CompanyLocation } from './company-location.entity';
import { CompanyDepartment } from './company-department.entity';
import { User } from '../../users/entities/user.entity';
import { JobListing } from '../../jobs/entities/job-listing.entity';

export enum CompanySize {
  XS = '1-10',
  S = '11-50',
  M = '51-200',
  L = '201-500',
  XL = '501-1000',
  XXL = '1001-5000',
  XXXL = '5001-10000',
  GIANT = '10000+',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

registerEnumType(CompanySize, {
  name: 'CompanySize',
});

registerEnumType(VerificationStatus, {
  name: 'VerificationStatus',
});

@ObjectType()
@Entity('company_profiles')
export class CompanyProfile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'short_description' })
  shortDescription: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'cover_image_url' })
  coverImageUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'website_url' })
  websiteUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'founded_year', type: 'smallint' })
  foundedYear: number;

  @Field(() => CompanySize, { nullable: true })
  @Column({
    type: 'enum',
    enum: CompanySize,
    nullable: true,
  })
  size: CompanySize;

  @Field({ nullable: true })
  @Column({ nullable: true })
  industry: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  headquarters: string;

  @Field(() => VerificationStatus)
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    name: 'verification_status',
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus: VerificationStatus;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'verified_at', type: 'timestamp with time zone' })
  verifiedAt: Date;

  @Field(() => Boolean)
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Field(() => Boolean)
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'social_links' })
  socialLinks: Record<string, string>;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  benefits: Record<string, any>;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @OneToMany(() => CompanyAdmin, admin => admin.company)
  admins: CompanyAdmin[];

  @OneToMany(() => CompanyVerificationDocument, doc => doc.company)
  verificationDocuments: CompanyVerificationDocument[];

  @OneToMany(() => CompanyLocation, location => location.company)
  locations: CompanyLocation[];

  @OneToMany(() => CompanyDepartment, department => department.company)
  departments: CompanyDepartment[];

  @OneToMany(() => JobListing, job => job.company)
  jobs: JobListing[];

  // Virtual fields
  @Field(() => Number)
  jobCount: number;

  @Field(() => User, { nullable: true })
  primaryAdmin: User;

  @Field(() => Boolean)
  canEdit: boolean;
}