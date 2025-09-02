import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { User } from '../users/entities/user.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PaginationInput } from '../../common/dto/pagination.input';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private notificationsService: NotificationsService,
  ) { }

  // Check if user has permission in workspace
  private async checkWorkspacePermission(workspaceId: string, userId: string, requiredRoles: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: {
        workspaceId,
        userId,
      }
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException('You do not have sufficient permissions');
    }
  }

  // Create a new project
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { workspaceId, name, description, status, createdById, startDate, dueDate, settings } = createProjectDto;

    // Check if workspace exists
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user has permission to create projects
    await this.checkWorkspacePermission(workspaceId, createdById, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]);

    // Create project
    const project = this.projectRepository.create({
      workspaceId,
      name,
      description,
      status,
      createdById,
      startDate,
      dueDate,
      settings,
    });

    const savedProject = await this.projectRepository.save(project);

    // Notify workspace members about new project
    const members = await this.memberRepository.find({
      where: { workspaceId },
      relations: ['user'],
    });

    for (const member of members) {
      if (member.userId !== createdById) {
        await this.notificationsService.create({
          userId: member.userId,
          type: NotificationType.PROJECT_CREATED,
          senderId: createdById,
          message: `New project created: ${name}`,
        });
      }
    }

    return this.findOne(savedProject.id, createdById);
  }

  // Get a single project
  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['workspace', 'createdBy', 'workspace.members'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to the workspace
    const isMember = project.workspace.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Calculate task counts
    const tasks = await this.taskRepository.find({
      where: { projectId: id },
    });

    project.taskCount = tasks.length;
    project.completedTaskCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
    project.progress = project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0;

    return project;
  }

  // Get all projects for a workspace
  async findAllForWorkspace(workspaceId: string, userId: string, paginationInput?: PaginationInput): Promise<Project[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    // Check if user has access to the workspace
    await this.checkWorkspacePermission(workspaceId, userId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]);

    // Get projects
    const projects = await this.projectRepository.find({
      where: { workspaceId },
      relations: ['createdBy'],
      skip,
      take,
      order: { updatedAt: 'DESC' },
    });

    // Calculate task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.taskRepository.find({
          where: { projectId: project.id },
        });

        project.taskCount = tasks.length;
        project.completedTaskCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
        project.progress = project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0;

        return project;
      })
    );

    return projectsWithCounts;
  }

  // Update a project
  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has permission to update projects
    await this.checkWorkspacePermission(project.workspaceId, userId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]);

    const { name, description, status, startDate, dueDate, settings } = updateProjectDto;

    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (settings !== undefined) project.settings = { ...project.settings, ...settings };

    const updatedProject = await this.projectRepository.save(project);

    return this.findOne(updatedProject.id, userId);
  }

  // Delete a project
  async remove(id: string, userId: string): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has permission to delete projects
    await this.checkWorkspacePermission(project.workspaceId, userId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

    // Delete project
    await this.projectRepository.remove(project);

    return true;
  }
}