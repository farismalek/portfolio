import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { Project } from './entities/project.entity';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { TaskComment } from './entities/task-comment.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PaginationInput } from '../../common/dto/pagination.input';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskComment)
    private commentRepository: Repository<TaskComment>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) { }

  // Check if user has permission in workspace
  private async checkWorkspacePermission(
    workspaceId: string,
    userId: string,
    requiredRoles: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
  ): Promise<WorkspaceMember> {
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

    return member;
  }

  // Create a new task
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const {
      workspaceId,
      projectId,
      parentId,
      title,
      description,
      status,
      priority,
      createdById,
      assignedToId,
      dueDate,
      metadata,
      orderIndex
    } = createTaskDto;

    // Check if workspace exists
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user has permission to create tasks
    await this.checkWorkspacePermission(
      workspaceId,
      createdById,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    // Check if project exists if provided
    if (projectId) {
      const project = await this.projectRepository.findOne({ where: { id: projectId, workspaceId } });
      if (!project) {
        throw new NotFoundException('Project not found in this workspace');
      }
    }

    // Check if parent task exists if provided
    if (parentId) {
      const parentTask = await this.taskRepository.findOne({ where: { id: parentId, workspaceId } });
      if (!parentTask) {
        throw new NotFoundException('Parent task not found');
      }
    }

    // Check if assigned user exists and is workspace member
    if (assignedToId) {
      const assignedMember = await this.memberRepository.findOne({
        where: { workspaceId, userId: assignedToId }
      });

      if (!assignedMember) {
        throw new BadRequestException('Assigned user is not a member of this workspace');
      }
    }

    // Create task
    const task = this.taskRepository.create({
      workspaceId,
      projectId,
      parentId,
      title,
      description,
      status: status || TaskStatus.TODO,
      priority: priority || TaskPriority.MEDIUM,
      createdById,
      assignedToId,
      dueDate,
      metadata,
      orderIndex: orderIndex || await this.getNextOrderIndex(projectId, parentId, status || TaskStatus.TODO)
    });

    const savedTask = await this.taskRepository.save(task);

    // If task is assigned, notify the assignee
    if (assignedToId && assignedToId !== createdById) {
      await this.notificationsService.create({
        userId: assignedToId,
        type: NotificationType.TASK_ASSIGNED,
        senderId: createdById,
        message: `You've been assigned to "${title}"`,
      });
    }

    // Emit task created event
    this.eventEmitter.emit('task.created', savedTask);

    return this.findOne(savedTask.id, createdById);
  }

  // Get a single task
  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: [
        'workspace',
        'project',
        'createdBy',
        'assignedTo',
        'parent',
        'comments',
        'comments.user'
      ],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to the workspace
    await this.checkWorkspacePermission(
      task.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]
    );

    // Calculate subtasks
    const subtasks = await this.taskRepository.find({
      where: { parentId: id },
    });

    task.subtaskCount = subtasks.length;
    task.completedSubtaskCount = subtasks.filter(t => t.status === TaskStatus.DONE).length;

    // Check if task is overdue
    if (task.dueDate) {
      task.isOverdue = task.dueDate < new Date() && task.status !== TaskStatus.DONE;
    } else {
      task.isOverdue = false;
    }

    // Set comment count
    task.commentCount = task.comments?.length || 0;

    return task;
  }

  // Get tasks with various filters
  async findTasks(
    filters: {
      workspaceId?: string;
      projectId?: string;
      parentId?: string;
      status?: TaskStatus;
      assignedToId?: string;
      createdById?: string;
    },
    userId: string,
    paginationInput?: PaginationInput
  ): Promise<Task[]> {
    const { skip = 0, take = 50 } = paginationInput || {};
    const { workspaceId, projectId, parentId, status, assignedToId, createdById } = filters;

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required');
    }

    // Check if user has access to the workspace
    await this.checkWorkspacePermission(
      workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]
    );

    // Build query
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.workspaceId = :workspaceId', { workspaceId });

    if (projectId) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }

    if (parentId) {
      queryBuilder.andWhere('task.parentId = :parentId', { parentId });
    } else if (parentId === null) {
      // Explicitly query for top-level tasks
      queryBuilder.andWhere('task.parentId IS NULL');
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (assignedToId) {
      queryBuilder.andWhere('task.assignedToId = :assignedToId', { assignedToId });
    }

    if (createdById) {
      queryBuilder.andWhere('task.createdById = :createdById', { createdById });
    }

    // Add order
    queryBuilder.orderBy('task.orderIndex', 'ASC');

    // Get tasks
    const tasks = await queryBuilder
      .skip(skip)
      .take(take)
      .getMany();

    // Process tasks to add virtual fields
    const processedTasks = await Promise.all(
      tasks.map(async (task) => {
        // Get subtasks for counts
        const subtasks = await this.taskRepository.find({
          where: { parentId: task.id },
        });

        task.subtaskCount = subtasks.length;
        task.completedSubtaskCount = subtasks.filter(t => t.status === TaskStatus.DONE).length;

        // Check if task is overdue
        if (task.dueDate) {
          task.isOverdue = task.dueDate < new Date() && task.status !== TaskStatus.DONE;
        } else {
          task.isOverdue = false;
        }

        // Get comment count
        task.commentCount = await this.commentRepository.count({
          where: { taskId: task.id },
        });

        return task;
      })
    );

    return processedTasks;
  }

  // Update a task
  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['workspace', 'assignedTo'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to update tasks
    await this.checkWorkspacePermission(
      task.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    const {
      title,
      description,
      status,
      priority,
      assignedToId,
      dueDate,
      metadata,
      orderIndex
    } = updateTaskDto;

    // Store previous values for notification
    const previousStatus = task.status;
    const previousAssignee = task.assignedToId;

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      task.status = status;

      // If marked as complete, set completed date
      if (status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE) {
        task.completedAt = new Date();
      } else if (status !== TaskStatus.DONE) {
        task.completedAt = null;
      }
    }
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (metadata !== undefined) task.metadata = { ...task.metadata, ...metadata };
    if (orderIndex !== undefined) task.orderIndex = orderIndex;

    // Check and update assignee if changed
    if (assignedToId !== undefined && assignedToId !== task.assignedToId) {
      if (assignedToId) {
        const assignedMember = await this.memberRepository.findOne({
          where: { workspaceId: task.workspaceId, userId: assignedToId }
        });

        if (!assignedMember) {
          throw new BadRequestException('Assigned user is not a member of this workspace');
        }
      }

      task.assignedToId = assignedToId;
    }

    const updatedTask = await this.taskRepository.save(task);

    // Send notifications for status changes
    if (status !== undefined && status !== previousStatus && task.assignedToId && task.assignedToId !== userId) {
      if (status === TaskStatus.DONE) {
        await this.notificationsService.create({
          userId: task.assignedToId,
          type: NotificationType.TASK_COMPLETED,
          senderId: userId,
          message: `Task "${task.title}" has been marked as complete`,
        });
      } else if (previousStatus === TaskStatus.DONE) {
        await this.notificationsService.create({
          userId: task.assignedToId,
          type: NotificationType.TASK_REOPENED,
          senderId: userId,
          message: `Task "${task.title}" has been reopened`,
        });
      } else {
        await this.notificationsService.create({
          userId: task.assignedToId,
          type: NotificationType.TASK_UPDATED,
          senderId: userId,
          message: `Task "${task.title}" has been updated to ${status}`,
        });
      }
    }

    // Send notification for new assignee
    if (assignedToId !== undefined && assignedToId !== previousAssignee && assignedToId && assignedToId !== userId) {
      await this.notificationsService.create({
        userId: assignedToId,
        type: NotificationType.TASK_ASSIGNED,
        senderId: userId,
        message: `You've been assigned to "${task.title}"`,
      });
    }

    // Emit task updated event
    this.eventEmitter.emit('task.updated', updatedTask);

    return this.findOne(updatedTask.id, userId);
  }

  // Delete a task
  async remove(id: string, userId: string): Promise<boolean> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to delete tasks
    await this.checkWorkspacePermission(
      task.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    // Delete task
    await this.taskRepository.remove(task);

    // Emit task deleted event
    this.eventEmitter.emit('task.deleted', { id, workspaceId: task.workspaceId });

    return true;
  }

  // Add a comment to a task
  async addComment(createCommentDto: CreateTaskCommentDto): Promise<TaskComment> {
    const { taskId, userId, content } = createCommentDto;

    // Check if task exists
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['workspace', 'assignedTo', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to comment
    await this.checkWorkspacePermission(
      task.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]
    );

    // Create comment
    const comment = this.commentRepository.create({
      taskId,
      userId,
      content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Send notification to task assignee and creator if different from commenter
    if (task.assignedToId && task.assignedToId !== userId) {
      await this.notificationsService.create({
        userId: task.assignedToId,
        type: NotificationType.TASK_COMMENT,
        senderId: userId,
        message: `New comment on task "${task.title}"`,
      });
    }

    if (task.createdById && task.createdById !== userId && task.createdById !== task.assignedToId) {
      await this.notificationsService.create({
        userId: task.createdById,
        type: NotificationType.TASK_COMMENT,
        senderId: userId,
        message: `New comment on task "${task.title}"`,
      });
    }

    // Emit comment added event
    this.eventEmitter.emit('task.comment.created', {
      ...savedComment,
      task,
    });

    // Return comment with user data
    return this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  // Get comments for a task
  async getComments(taskId: string, userId: string, paginationInput?: PaginationInput): Promise<TaskComment[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    // Check if task exists
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['workspace'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has permission to view comments
    await this.checkWorkspacePermission(
      task.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]
    );

    // Get comments
    return this.commentRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip,
      take,
    });
  }

  // Reorder tasks (update order indices)
  async reorderTasks(
    workspaceId: string,
    taskIds: string[],
    status?: TaskStatus,
    userId?: string
  ): Promise<boolean> {
    // Check if user has permission
    await this.checkWorkspacePermission(
      workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    // Update order indices
    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      const task = await this.taskRepository.findOne({ where: { id: taskId, workspaceId } });

      if (task) {
        task.orderIndex = i;
        if (status) {
          task.status = status;
        }
        await this.taskRepository.save(task);
      }
    }

    return true;
  }

  // Helper method to get next order index for a task
  private async getNextOrderIndex(projectId?: string, parentId?: string, status?: TaskStatus): Promise<number> {
    const query: any = {};

    if (projectId) query.projectId = projectId;
    if (parentId) {
      query.parentId = parentId;
    } else {
      query.parentId = null; // Ensure it's a top-level task
    }
    if (status) query.status = status;

    const lastTask = await this.taskRepository.findOne({
      where: query,
      order: { orderIndex: 'DESC' },
    });

    return lastTask ? lastTask.orderIndex + 1 : 0;
  }
}