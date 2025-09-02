import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Workspace } from './workspace.entity';
import { Task } from './task.entity';
import { CollaborativeBoard } from './collaborative-board.entity';

@ObjectType()
@Entity('projects')
export class Project {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Workspace)
  @ManyToOne(() => Workspace, workspace => workspace.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Field()
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column()
  status: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Field()
  @Column({ name: 'created_by' })
  createdById: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'start_date', type: 'timestamp with time zone', nullable: true })
  startDate: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'due_date', type: 'timestamp with time zone', nullable: true })
  dueDate: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Field(() => [Task])
  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @Field(() => [CollaborativeBoard])
  @OneToMany(() => CollaborativeBoard, board => board.project)
  boards: CollaborativeBoard[];

  // Virtual fields
  @Field(() => Number)
  taskCount: number;

  @Field(() => Number)
  completedTaskCount: number;

  @Field(() => Number)
  progress: number;
}