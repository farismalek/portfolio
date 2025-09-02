import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Entity('user_presence')
export class UserPresence {
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

  @Field(() => Date)
  @Column({ name: 'last_active_at', type: 'timestamp with time zone' })
  lastActiveAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  deviceInfo: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ipAddress: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}