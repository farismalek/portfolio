import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Workspace } from './workspace.entity';
import { Project } from './project.entity';
import { TaskComment } from './task-comment.entity';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

registerEnumType(TaskPriority, {
  name: 'TaskPriority',
});

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
});

@ObjectType()
@Entity('tasks')
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field({ nullable: true })
  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Field(() => Workspace)
  @ManyToOne(() => Workspace, workspace => workspace.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Field()
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => TaskStatus)
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Field(() => TaskPriority)
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Field()
  @Column({ name: 'created_by' })
  createdById: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Field({ nullable: true })
  @Column({ name: 'assigned_to', nullable: true })
  assignedToId: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'due_date', type: 'timestamp with time zone', nullable: true })
  dueDate: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @Field(() => Float)
  @Column({ name: 'order_index', type: 'float', default: 0 })
  orderIndex: number;

  @Field(() => Task, { nullable: true })
  @ManyToOne(() => Task, task => task.subtasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Task;

  @Field({ nullable: true })
  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Field(() => [Task], { nullable: true })
  @OneToMany(() => Task, task => task.parent)
  subtasks: Task[];

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => [TaskComment])
  @OneToMany(() => TaskComment, comment => comment.task)
  comments: TaskComment[];

  // Virtual fields
  @Field(() => Number)
  commentCount: number;

  @Field(() => Number)
  subtaskCount: number;

  @Field(() => Number)
  completedSubtaskCount: number;

  @Field(() => Boolean)
  isOverdue: boolean;
}