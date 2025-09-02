import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Workspace } from './workspace.entity';

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

registerEnumType(WorkspaceRole, {
  name: 'WorkspaceRole',
});

@ObjectType()
@Entity('workspace_members')
export class WorkspaceMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Workspace)
  @ManyToOne(() => Workspace, workspace => workspace.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Field()
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => WorkspaceRole)
  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.EDITOR,
  })
  role: WorkspaceRole;

  @Field(() => Date)
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by' })
  invitedBy: User;

  @Field({ nullable: true })
  @Column({ name: 'invited_by', nullable: true })
  invitedById: string;
}