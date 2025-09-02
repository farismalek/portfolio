import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { User } from '../users/entities/user.entity';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PaginationInput } from '../../common/dto/pagination.input';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private notificationsService: NotificationsService,
  ) { }

  // Create a new workspace
  async create(createWorkspaceDto: CreateWorkspaceDto): Promise<Workspace> {
    const { name, description, ownerId, avatarUrl, settings } = createWorkspaceDto;

    // Check if user exists
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('User not found');
    }

    // Create workspace
    const workspace = this.workspaceRepository.create({
      name,
      description,
      ownerId,
      avatarUrl,
      settings,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Add owner as a member with owner role
    const ownerMember = this.memberRepository.create({
      workspaceId: savedWorkspace.id,
      userId: ownerId,
      role: WorkspaceRole.OWNER,
      invitedById: ownerId,
    });

    await this.memberRepository.save(ownerMember);

    return this.findOne(savedWorkspace.id);
  }

  // Get a single workspace
  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Calculate counts
    workspace.memberCount = workspace.members.length;
    workspace.projectCount = await this.projectRepository.count({
      where: { workspaceId: id },
    });

    return workspace;
  }

  // Get all workspaces for a user
  async findAllForUser(userId: string, paginationInput?: PaginationInput): Promise<Workspace[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    // Get memberships for user
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['workspace', 'workspace.owner'],
    });

    const workspaceIds = memberships.map(m => m.workspaceId);

    if (workspaceIds.length === 0) {
      return [];
    }

    // Get full workspace data with members
    const workspaces = await this.workspaceRepository.find({
      where: { id: In(workspaceIds) },
      relations: ['owner', 'members', 'members.user'],
      skip,
      take,
      order: { updatedAt: 'DESC' },
    });

    // Calculate counts for each workspace
    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (workspace) => {
        workspace.memberCount = workspace.members.length;
        workspace.projectCount = await this.projectRepository.count({
          where: { workspaceId: workspace.id },
        });
        return workspace;
      })
    );

    return workspacesWithCounts;
  }

  // Update a workspace
  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string): Promise<Workspace> {
    const workspace = await this.findOne(id);

    // Check if user has permission to update
    const member = workspace.members.find(m => m.userId === userId);
    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('You do not have permission to update this workspace');
    }

    const { name, description, avatarUrl, settings } = updateWorkspaceDto;

    // Update fields
    if (name !== undefined) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (avatarUrl !== undefined) workspace.avatarUrl = avatarUrl;
    if (settings !== undefined) workspace.settings = { ...workspace.settings, ...settings };

    const updatedWorkspace = await this.workspaceRepository.save(workspace);

    return this.findOne(updatedWorkspace.id);
  }

  // Delete a workspace
  async remove(id: string, userId: string): Promise<boolean> {
    const workspace = await this.findOne(id);

    // Only owner can delete workspace
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    // Delete the workspace
    await this.workspaceRepository.remove(workspace);

    return true;
  }

  // Add a member to workspace
  async addMember(id: string, addMemberDto: AddMemberDto, inviterId: string): Promise<WorkspaceMember> {
    const { userId, role } = addMemberDto;

    // Check if workspace exists
    const workspace = await this.findOne(id);

    // Check if inviter has permission
    const inviter = workspace.members.find(m => m.userId === inviterId);
    if (!inviter || (inviter.role !== WorkspaceRole.OWNER && inviter.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMembership = workspace.members.find(m => m.userId === userId);
    if (existingMembership) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Only owner can add admins
    if (role === WorkspaceRole.ADMIN && inviter.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the workspace owner can add administrators');
    }

    // Cannot add another owner
    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException('A workspace can only have one owner');
    }

    // Create membership
    const member = this.memberRepository.create({
      workspaceId: id,
      userId,
      role,
      invitedById: inviterId,
    });

    const savedMember = await this.memberRepository.save(member);

    // Send notification to user
    await this.notificationsService.create({
      userId,
      type: NotificationType.WORKSPACE_INVITATION,
      senderId: inviterId,
      message: `You've been added to the workspace ${workspace.name}`,
    });

    return this.memberRepository.findOne({
      where: { id: savedMember.id },
      relations: ['user', 'workspace'],
    });
  }

  // Update a member's role
  async updateMember(workspaceId: string, memberId: string, updateMemberDto: UpdateMemberDto, userId: string): Promise<WorkspaceMember> {
    const { role } = updateMemberDto;

    // Check if workspace exists
    const workspace = await this.findOne(workspaceId);

    // Check if updater has permission
    const updater = workspace.members.find(m => m.userId === userId);
    if (!updater || updater.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the workspace owner can update member roles');
    }

    // Find member to update
    const member = workspace.members.find(m => m.id === memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner's role
    if (member.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot change the owner\'s role');
    }

    // Cannot set another member as owner
    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException('A workspace can only have one owner');
    }

    // Update role
    member.role = role;

    const updatedMember = await this.memberRepository.save(member);

    return this.memberRepository.findOne({
      where: { id: updatedMember.id },
      relations: ['user', 'workspace'],
    });
  }

  // Remove a member from workspace
  async removeMember(workspaceId: string, memberUserId: string, requesterId: string): Promise<boolean> {
    // Check if workspace exists
    const workspace = await this.findOne(workspaceId);

    // Find member to remove
    const member = workspace.members.find(m => m.userId === memberUserId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check permission
    const requester = workspace.members.find(m => m.userId === requesterId);
    if (!requester) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Determine if requester has permission to remove
    const isSelfRemoval = memberUserId === requesterId;
    const hasPermission =
      isSelfRemoval || // User can remove themself
      requester.role === WorkspaceRole.OWNER || // Owner can remove anyone
      (requester.role === WorkspaceRole.ADMIN && member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN); // Admin can remove editors/viewers

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to remove this member');
    }

    // Cannot remove the owner
    if (member.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }

    // Remove membership
    await this.memberRepository.remove(member);

    // If not self-removal, send notification
    if (!isSelfRemoval) {
      await this.notificationsService.create({
        userId: memberUserId,
        type: NotificationType.WORKSPACE_REMOVED,
        senderId: requesterId,
        message: `You've been removed from the workspace ${workspace.name}`,
      });
    }

    return true;
  }

  // Transfer ownership of a workspace
  async transferOwnership(workspaceId: string, newOwnerId: string, currentOwnerId: string): Promise<Workspace> {
    // Check if workspace exists
    const workspace = await this.findOne(workspaceId);

    // Verify current owner
    if (workspace.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only the workspace owner can transfer ownership');
    }

    // Check if new owner is a member
    const newOwnerMembership = workspace.members.find(m => m.userId === newOwnerId);
    if (!newOwnerMembership) {
      throw new NotFoundException('The new owner must be a member of the workspace');
    }

    // Get current owner membership
    const currentOwnerMembership = workspace.members.find(m => m.userId === currentOwnerId);

    // Update workspace owner
    workspace.ownerId = newOwnerId;
    await this.workspaceRepository.save(workspace);

    // Update memberships
    newOwnerMembership.role = WorkspaceRole.OWNER;
    await this.memberRepository.save(newOwnerMembership);

    // Demote current owner to admin
    currentOwnerMembership.role = WorkspaceRole.ADMIN;
    await this.memberRepository.save(currentOwnerMembership);

    // Send notification to new owner
    await this.notificationsService.create({
      userId: newOwnerId,
      type: NotificationType.WORKSPACE_OWNERSHIP,
      senderId: currentOwnerId,
      message: `You've become the owner of workspace ${workspace.name}`,
    });

    return this.findOne(workspaceId);
  }
}