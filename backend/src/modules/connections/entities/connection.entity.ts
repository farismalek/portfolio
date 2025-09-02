import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

export enum ConnectionType {
  FOLLOW = 'follow',
  CONNECTION = 'connection',
}

registerEnumType(ConnectionStatus, {
  name: 'ConnectionStatus',
});

registerEnumType(ConnectionType, {
  name: 'ConnectionType',
});

@ObjectType()
@Entity('connections')
export class Connection {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @Field()
  @Column({ name: 'follower_id' })
  followerId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;

  @Field()
  @Column({ name: 'following_id' })
  followingId: string;

  @Field(() => ConnectionStatus)
  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @Field(() => ConnectionType)
  @Column({
    type: 'enum',
    enum: ConnectionType,
    default: ConnectionType.FOLLOW,
  })
  type: ConnectionType;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}