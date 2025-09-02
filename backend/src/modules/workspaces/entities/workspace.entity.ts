import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { CollaborativeBoard } from './collaborative-board.entity';

@ObjectType()
@Entity('workspaces')
export class Workspace {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Field()
  @Column({ name: 'owner_id' })
  ownerId: string;

  @Field({ nullable: true })
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Field(() => [WorkspaceMember])
  @OneToMany(() => WorkspaceMember, member => member.workspace)
  members: WorkspaceMember[];

  @Field(() => [Project])
  @OneToMany(() => Project, project => project.workspace)
  projects: Project[];

  @Field(() => [Task])
  @OneToMany(() => Task, task => task.workspace)
  tasks: Task[];

  @Field(() => [CollaborativeBoard])
  @OneToMany(() => CollaborativeBoard, board => board.workspace)
  boards: CollaborativeBoard[];

  // Virtual fields
  @Field(() => Number)
  memberCount: number;

  @Field(() => Number)
  projectCount: number;
}