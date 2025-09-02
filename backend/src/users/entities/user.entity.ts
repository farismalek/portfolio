import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Profile } from '../../profiles/entities/profile.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column({ unique: true })
  username: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Field(() => Boolean)
  @Column({ default: false })
  emailVerified: boolean;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  auth0Id: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Profile])
  @OneToMany(() => Profile, (profile) => profile.user)
  profiles: Profile[];

  @Field(() => [Portfolio])
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];

  // Virtual field for full name
  @Field()
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username;
  }
}