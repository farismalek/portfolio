import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CompanyProfile, VerificationStatus } from './company-profile.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('company_verification_documents')
export class CompanyVerificationDocument {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CompanyProfile)
  @ManyToOne(() => CompanyProfile, company => company.verificationDocuments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field()
  @Column({ name: 'company_id' })
  companyId: string;

  @Field()
  @Column({ name: 'document_type' })
  documentType: string;

  @Field()
  @Column({ name: 'document_url' })
  documentUrl: string;

  @Field(() => VerificationStatus)
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submitted_by' })
  submittedBy: User;

  @Field()
  @Column({ name: 'submitted_by' })
  submittedById: string;

  @Field(() => Date)
  @Column({ name: 'submitted_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'reviewed_by', nullable: true })
  reviewedById: string;

  @Field({ nullable: true })
  @Column({ name: 'reviewed_at', type: 'timestamp with time zone', nullable: true })
  reviewedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes: string;
}