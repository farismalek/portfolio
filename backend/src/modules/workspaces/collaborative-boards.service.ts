import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollaborativeBoard, BoardType } from './entities/collaborative-board.entity';
import { Workspace } from './entities/workspace.entity';
import { Project } from './entities/project.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PaginationInput } from '../../common/dto/pagination.input';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CollaborativeBoardsService {
  constructor(
    @InjectRepository(CollaborativeBoard)
    private boardRepository: Repository<CollaborativeBoard>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) { }

  // Check if user has permission in workspace
  private async checkWorkspacePermission(
    workspaceId: string,
    userId: string,
    requiredRoles: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
  ): Promise<void> {
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

  // Create a new collaborative board
  async create(createBoardDto: CreateBoardDto): Promise<CollaborativeBoard> {
    const {
      workspaceId,
      projectId,
      title,
      description,
      type,
      createdById,
      content,
      settings
    } = createBoardDto;

    // Either workspaceId or projectId must be provided
    if (!workspaceId && !projectId) {
      throw new BadRequestException('Either workspaceId or projectId must be provided');
    }

    // If projectId is provided, get its workspaceId
    let effectiveWorkspaceId = workspaceId;
    if (projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['workspace'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      effectiveWorkspaceId = project.workspaceId;
    }

    // Check if workspace exists
    const workspace = await this.workspaceRepository.findOne({ where: { id: effectiveWorkspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user has permission to create boards
    await this.checkWorkspacePermission(
      effectiveWorkspaceId,
      createdById,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    // Create board
    const board = this.boardRepository.create({
      workspaceId: effectiveWorkspaceId,
      projectId,
      title,
      description,
      type: type || BoardType.KANBAN,
      createdById,
      content: content || this.getDefaultContent(type || BoardType.KANBAN),
      settings: settings || {},
    });

    const savedBoard = await this.boardRepository.save(board);

    // Notify workspace members about new board
    if (projectId) {
      // Only notify project members (would need a way to get project members)
    } else {
      const members = await this.memberRepository.find({
        where: { workspaceId: effectiveWorkspaceId },
      });

      for (const member of members) {
        if (member.userId !== createdById) {
          await this.notificationsService.create({
            userId: member.userId,
            type: NotificationType.BOARD_CREATED,
            senderId: createdById,
            message: `New ${board.type.toLowerCase()} board created: ${title}`,
          });
        }
      }
    }

    // Emit board created event
    this.eventEmitter.emit('board.created', savedBoard);

    return this.findOne(savedBoard.id, createdById);
  }

  // Get a single board
  async findOne(id: string, userId: string): Promise<CollaborativeBoard> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['workspace', 'project', 'createdBy', 'lastEditedBy'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user has access to the workspace
    await this.checkWorkspacePermission(
      board.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]
    );

    return board;
  }

  // Get all boards for a workspace or project
  async findAll(
    filters: {
      workspaceId?: string;
      projectId?: string;
      type?: BoardType;
    },
    userId: string,
    paginationInput?: PaginationInput
  ): Promise<CollaborativeBoard[]> {
    const { skip = 0, take = 20 } = paginationInput || {};
    const { workspaceId, projectId, type } = filters;

    // Either workspaceId or projectId must be provided
    if (!workspaceId && !projectId) {
      throw new BadRequestException('Either workspaceId or projectId must be provided');
    }

    // If projectId is provided, get its workspaceId
    let effectiveWorkspaceId = workspaceId;
    if (projectId && !workspaceId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      effectiveWorkspaceId = project.workspaceId;
    }

    // Check if user has access to the workspace
    await this.checkWorkspacePermission(
      effectiveWorkspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR, WorkspaceRole.VIEWER]
    );

    // Build query
    const whereClause: any = {};

    if (workspaceId) whereClause.workspaceId = workspaceId;
    if (projectId) whereClause.projectId = projectId;
    if (type) whereClause.type = type;

    // Get boards
    return this.boardRepository.find({
      where: whereClause,
      relations: ['createdBy', 'lastEditedBy'],
      order: { updatedAt: 'DESC' },
      skip,
      take,
    });
  }

  // Update a board
  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<CollaborativeBoard> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user has permission to update boards
    await this.checkWorkspacePermission(
      board.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    const { title, description, content, settings } = updateBoardDto;

    // Update fields
    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (content !== undefined) board.content = content;
    if (settings !== undefined) board.settings = { ...board.settings, ...settings };

    // Update last edited info
    board.lastEditedById = userId;

    const updatedBoard = await this.boardRepository.save(board);

    // Emit board updated event
    this.eventEmitter.emit('board.updated', {
      ...updatedBoard,
      updatedBy: userId,
    });

    return this.findOne(updatedBoard.id, userId);
  }

  // Delete a board
  async remove(id: string, userId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user has permission to delete boards
    await this.checkWorkspacePermission(
      board.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]
    );

    // Delete board
    await this.boardRepository.remove(board);

    // Emit board deleted event
    this.eventEmitter.emit('board.deleted', {
      id,
      workspaceId: board.workspaceId,
      projectId: board.projectId,
    });

    return true;
  }

  // Update board content in realtime (collaborative editing)
  async updateContent(id: string, content: any, userId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user has permission to edit boards
    await this.checkWorkspacePermission(
      board.workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    );

    // Update content and last edited info
    board.content = content;
    board.lastEditedById = userId;

    await this.boardRepository.save(board);

    // Emit content updated event
    this.eventEmitter.emit('board.content.updated', {
      boardId: id,
      content,
      updatedBy: userId,
      timestamp: new Date(),
    });

    return true;
  }

  // Get default content templates for different board types
  private getDefaultContent(type: BoardType): any {
    switch (type) {
      case BoardType.KANBAN:
        return {
          columns: [
            { id: 'todo', title: 'To Do', cards: [] },
            { id: 'in-progress', title: 'In Progress', cards: [] },
            { id: 'review', title: 'Review', cards: [] },
            { id: 'done', title: 'Done', cards: [] },
          ]
        };

      case BoardType.WHITEBOARD:
        return {
          objects: [],
          background: {
            color: '#f5f5f5',
            grid: true,
          }
        };

      case BoardType.DOCUMENT:
        return {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'New Document' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Start typing here...' }]
            }
          ]
        };

      default:
        return {};
    }
  }
}