import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { FreelancerProfile } from './freelancer-profile.entity';

@ObjectType()
@Entity('freelancer_services')
export class FreelancerService {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => FreelancerProfile)
  @ManyToOne(() => FreelancerProfile, profile => profile.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'freelancer_id' })
  freelancer: FreelancerProfile;

  @Field()
  @Column({ name: 'freelancer_id' })
  freelancerId: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ type: 'text' })
  description: string;

  @Field(() => Int)
  @Column()
  price: number;

  @Field()
  @Column({ default: 'USD' })
  currency: string;

  @Field(() => Int)
  @Column({ name: 'delivery_time' })
  deliveryTime: number;

  @Field()
  @Column({ name: 'delivery_unit', default: 'days' })
  deliveryUnit: string;

  @Field()
  @Column()
  category: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subcategory: string;

  @Field(() => Boolean)
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'image_urls', type: 'text', array: true, nullable: true })
  imageUrls: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'text', array: true, nullable: true })
  skills: string[];

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Virtual fields
  @Field(() => String)
  formattedPrice: string;
}