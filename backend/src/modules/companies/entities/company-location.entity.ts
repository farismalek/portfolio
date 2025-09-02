import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CompanyProfile } from './company-profile.entity';

@ObjectType()
@Entity('company_locations')
export class CompanyLocation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CompanyProfile)
  @ManyToOne(() => CompanyProfile, company => company.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field()
  @Column({ name: 'company_id' })
  companyId: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'address_line1' })
  addressLine1: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'address_line2' })
  addressLine2: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'postal_code' })
  postalCode: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country: string;

  @Field(() => Boolean)
  @Column({ name: 'is_headquarters', default: false })
  isHeadquarters: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}