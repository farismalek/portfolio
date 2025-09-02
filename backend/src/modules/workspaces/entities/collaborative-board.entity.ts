import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Workspace } from './workspace.entity';
import { Project } from './project.entity';

export enum BoardType {
  KANBAN = 'kanban',
  WHITEBOARD = 'whiteboard',
  DOCUMENT = 'document',
}

registerEnumType(BoardType, {
  name: 'BoardType',
});

@ObjectType()
@Entity('collaborative_boards')
export class CollaborativeBoard {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => BoardType)
  @Column({
    type: 'enum',
    enum: BoardType,
    default: BoardType.KANBAN,
  })
  type: BoardType;

  @Field(() => Workspace, { nullable: true })
  @ManyToOne(() => Workspace, workspace => workspace.boards, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Field({ nullable: true })
  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, project => project.boards, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field({ nullable: true })
  @Column({ name: 'project_id', nullable: true })
  projectId: string;

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

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'last_edited_by' })
  lastEditedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'last_edited_by', nullable: true })
  lastEditedById: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;
}