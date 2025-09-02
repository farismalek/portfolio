import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Project } from '../../workspaces/entities/project.entity';
import { Task } from '../../workspaces/entities/task.entity';
import { Conversation } from '../../messaging/entities/conversation.entity';
import { Message } from '../../messaging/entities/message.entity';
import { FileVersion } from './file-version.entity';

@ObjectType()
@Entity('shared_files')
export class SharedFile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ name: 'file_path' })
  filePath: string;

  @Field()
  @Column({ name: 'file_type' })
  fileType: string;

  @Field()
  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Field(() => Workspace, { nullable: true })
  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Field({ nullable: true })
  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field({ nullable: true })
  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Field(() => Task, { nullable: true })
  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Field({ nullable: true })
  @Column({ name: 'task_id', nullable: true })
  taskId: string;

  @Field(() => Conversation, { nullable: true })
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Field({ nullable: true })
  @Column({ name: 'conversation_id', nullable: true })
  conversationId: string;

  @Field(() => Message, { nullable: true })
  @ManyToOne(() => Message, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Field({ nullable: true })
  @Column({ name: 'message_id', nullable: true })
  messageId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Field()
  @Column({ name: 'uploaded_by' })
  uploadedById: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => [FileVersion])
  @OneToMany(() => FileVersion, version => version.file)
  versions: FileVersion[];

  // Virtual fields
  @Field()
  url: string;

  @Field(() => Boolean)
  hasPreview: boolean;

  @Field(() => String, { nullable: true })
  previewUrl: string;
}