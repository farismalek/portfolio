import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CompanyProfile } from './company-profile.entity';
import { User } from '../../users/entities/user.entity';

@ObjectType()
@Entity('company_admins')
export class CompanyAdmin {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CompanyProfile)
  @ManyToOne(() => CompanyProfile, company => company.admins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompanyProfile;

  @Field()
  @Column({ name: 'company_id' })
  companyId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field()
  @Column()
  role: string;

  @Field(() => Boolean)
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}