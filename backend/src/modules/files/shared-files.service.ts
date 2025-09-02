import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SharedFile } from './entities/shared-file.entity';
import { FileVersion } from './entities/file-version.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { Project } from '../workspaces/entities/project.entity';
import { Task } from '../workspaces/entities/task.entity';
import { Conversation } from '../messaging/entities/conversation.entity';
import { Message, MessageType } from '../messaging/entities/message.entity';
import { WorkspaceMember, WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { ConversationParticipant } from '../messaging/entities/conversation-participant.entity';
import { User } from '../users/entities/user.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CreateFileVersionDto } from './dto/create-file-version.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { S3Service } from '../aws/s3.service';

@Injectable()
export class SharedFilesService {
  constructor(
    @InjectRepository(SharedFile)
    private fileRepository: Repository<SharedFile>,
    @InjectRepository(FileVersion)
    private versionRepository: Repository<FileVersion>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ConversationParticipant)
    private conversationParticipantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private s3Service: S3Service,
  ) { }

  // Check if user has permission to access a workspace
  private async checkWorkspaceAccess(workspaceId: string, userId: string): Promise<void> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
  }

  // Check if user has permission to access a conversation
  private async checkConversationAccess(conversationId: string, userId: string): Promise<void> {
    const participant = await this.conversationParticipantRepository.findOne({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
  }

  // Create a new file
  async create(createFileDto: CreateFileDto): Promise<SharedFile> {
    const {
      name,
      description,
      filePath,
      fileType,
      fileSize,
      workspaceId,
      projectId,
      taskId,
      conversationId,
      messageId,
      uploadedById,
      metadata,
    } = createFileDto;

    // Validate context - one of the contexts must be provided
    if (!workspaceId && !projectId && !taskId && !(conversationId && messageId)) {
      throw new BadRequestException('At least one context (workspace, project, task, or conversation+message) must be provided');
    }

    // Check permissions based on context
    if (workspaceId) {
      await this.checkWorkspaceAccess(workspaceId, uploadedById);
    } else if (projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['workspace'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await this.checkWorkspaceAccess(project.workspaceId, uploadedById);
    } else if (taskId) {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['workspace'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await this.checkWorkspaceAccess(task.workspaceId, uploadedById);
    } else if (conversationId) {
      await this.checkConversationAccess(conversationId, uploadedById);

      if (messageId) {
        const message = await this.messageRepository.findOne({
          where: { id: messageId, conversationId },
        });

        if (!message) {
          throw new NotFoundException('Message not found in the specified conversation');
        }
      }
    }

    // Create file record
    const file = this.fileRepository.create({
      name,
      description,
      filePath,
      fileType,
      fileSize,
      workspaceId,
      projectId,
      taskId,
      conversationId,
      messageId,
      uploadedById,
      metadata,
    });

    const savedFile = await this.fileRepository.save(file);

    // Create initial version record
    const version = this.versionRepository.create({
      fileId: savedFile.id,
      versionNumber: 1,
      filePath,
      fileSize,
      uploadedById,
    });

    await this.versionRepository.save(version);

    // Generate URLs
    savedFile.url = await this.getFileUrl(savedFile.filePath);
    savedFile.hasPreview = this.canGeneratePreview(savedFile.fileType);
    if (savedFile.hasPreview) {
      savedFile.previewUrl = await this.getPreviewUrl(savedFile.filePath);
    }

    return savedFile;
  }

  // Create a file from a message
  async createFromMessage(message: Message): Promise<SharedFile | null> {
    // Only process file/image messages with media
    if (![MessageType.FILE, MessageType.IMAGE].includes(message.type) || !message.media) {
      return null;
    }

    // Extract file info from message media
    const { filePath, fileName, fileSize, fileType } = message.media;

    if (!filePath || !fileName || !fileSize) {
      return null;
    }

    // Create file record
    const file = await this.create({
      name: fileName,
      filePath,
      fileType: fileType || this.getFileTypeFromPath(filePath),
      fileSize,
      conversationId: message.conversationId,
      messageId: message.id,
      uploadedById: message.senderId,
    });

    return file;
  }

  // Helper to infer file type from path if not provided
  private getFileTypeFromPath(filePath: string): string {
    const extension = filePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      zip: 'application/zip',
      // Add more as needed
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  // Get a single file
  async findOne(id: string, userId: string): Promise<SharedFile> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'versions', 'versions.uploadedBy'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check permissions based on context
    if (file.workspaceId) {
      await this.checkWorkspaceAccess(file.workspaceId, userId);
    } else if (file.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: file.projectId },
        relations: ['workspace'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await this.checkWorkspaceAccess(project.workspaceId, userId);
    } else if (file.taskId) {
      const task = await this.taskRepository.findOne({
        where: { id: file.taskId },
        relations: ['workspace'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await this.checkWorkspaceAccess(task.workspaceId, userId);
    } else if (file.conversationId) {
      await this.checkConversationAccess(file.conversationId, userId);
    }

    // Generate URLs
    file.url = await this.getFileUrl(file.filePath);
    file.hasPreview = this.canGeneratePreview(file.fileType);
    if (file.hasPreview) {
      file.previewUrl = await this.getPreviewUrl(file.filePath);
    }

    // Generate URLs for versions
    if (file.versions) {
      for (const version of file.versions) {
        version.url = await this.getFileUrl(version.filePath);
      }
    }

    return file;
  }

  // Get files with filtering
  async findFiles(
    filters: {
      workspaceId?: string;
      projectId?: string;
      taskId?: string;
      conversationId?: string;
      uploadedById?: string;
      fileType?: string;
    },
    userId: string,
    paginationInput?: PaginationInput
  ): Promise<SharedFile[]> {
    const { skip = 0, take = 20 } = paginationInput || {};
    const { workspaceId, projectId, taskId, conversationId, uploadedById, fileType } = filters;

    // Validate context - at least one filter must be provided
    if (!workspaceId && !projectId && !taskId && !conversationId && !uploadedById) {
      throw new BadRequestException('At least one filter must be provided');
    }

    // Check permissions based on context
    if (workspaceId) {
      await this.checkWorkspaceAccess(workspaceId, userId);
    } else if (projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['workspace'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await this.checkWorkspaceAccess(project.workspaceId, userId);
    } else if (taskId) {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['workspace'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await this.checkWorkspaceAccess(task.workspaceId, userId);
    } else if (conversationId) {
      await this.checkConversationAccess(conversationId, userId);
    }

    // Build query
    const queryBuilder = this.fileRepository.createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .orderBy('file.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (workspaceId) {
      queryBuilder.andWhere('file.workspaceId = :workspaceId', { workspaceId });
    }

    if (projectId) {
      queryBuilder.andWhere('file.projectId = :projectId', { projectId });
    }

    if (taskId) {
      queryBuilder.andWhere('file.taskId = :taskId', { taskId });
    }

    if (conversationId) {
      queryBuilder.andWhere('file.conversationId = :conversationId', { conversationId });
    }

    if (uploadedById) {
      queryBuilder.andWhere('file.uploadedById = :uploadedById', { uploadedById });
    }

    if (fileType) {
      queryBuilder.andWhere('file.fileType LIKE :fileType', { fileType: `${fileType}%` });
    }

    const files = await queryBuilder.getMany();

    // Generate URLs for each file
    for (const file of files) {
      file.url = await this.getFileUrl(file.filePath);
      file.hasPreview = this.canGeneratePreview(file.fileType);
      if (file.hasPreview) {
        file.previewUrl = await this.getPreviewUrl(file.filePath);
      }
    }

    return files;
  }

  // Update a file
  async update(id: string, updateFileDto: UpdateFileDto, userId: string): Promise<SharedFile> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check permissions
    // Only uploader can update basic metadata unless they're in workspace/project context
    if (file.uploadedById !== userId) {
      if (file.workspaceId) {
        const member = await this.workspaceMemberRepository.findOne({
          where: {
            workspaceId: file.workspaceId,
            userId,
            role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
          },
        });

        if (!member) {
          throw new ForbiddenException('You do not have permission to update this file');
        }
      } else if (file.projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: file.projectId },
          relations: ['workspace'],
        });

        if (!project) {
          throw new NotFoundException('Project not found');
        }

        const member = await this.workspaceMemberRepository.findOne({
          where: {
            workspaceId: project.workspaceId,
            userId,
            role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
          },
        });

        if (!member) {
          throw new ForbiddenException('You do not have permission to update this file');
        }
      } else {
        throw new ForbiddenException('Only the uploader can update this file');
      }
    }

    const { name, description, metadata } = updateFileDto;

    // Update fields
    if (name !== undefined) file.name = name;
    if (description !== undefined) file.description = description;
    if (metadata !== undefined) file.metadata = { ...file.metadata, ...metadata };

    const updatedFile = await this.fileRepository.save(file);

    // Generate URLs
    updatedFile.url = await this.getFileUrl(updatedFile.filePath);
    updatedFile.hasPreview = this.canGeneratePreview(updatedFile.fileType);
    if (updatedFile.hasPreview) {
      updatedFile.previewUrl = await this.getPreviewUrl(updatedFile.filePath);
    }

    return updatedFile;
  }

  // Create a new version of a file
  async createVersion(fileId: string, createVersionDto: CreateFileVersionDto): Promise<FileVersion> {
    const { filePath, fileSize, uploadedById, notes } = createVersionDto;

    // Check if file exists
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['versions'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check permissions
    if (file.workspaceId) {
      await this.checkWorkspaceAccess(file.workspaceId, uploadedById);
    } else if (file.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: file.projectId },
        relations: ['workspace'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await this.checkWorkspaceAccess(project.workspaceId, uploadedById);
    } else if (file.taskId) {
      const task = await this.taskRepository.findOne({
        where: { id: file.taskId },
        relations: ['workspace'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await this.checkWorkspaceAccess(task.workspaceId, uploadedById);
    } else if (file.conversationId) {
      await this.checkConversationAccess(file.conversationId, uploadedById);
    }

    // Get next version number
    const versionNumber = file.versions?.length ? Math.max(...file.versions.map(v => v.versionNumber)) + 1 : 1;

    // Create version record
    const version = this.versionRepository.create({
      fileId,
      versionNumber,
      filePath,
      fileSize,
      uploadedById,
      notes,
    });

    const savedVersion = await this.versionRepository.save(version);

    // Update file's main path to point to latest version
    file.filePath = filePath;
    file.fileSize = fileSize;
    await this.fileRepository.save(file);

    // Notify stakeholders about new version
    this.notifyAboutNewVersion(file, savedVersion, uploadedById);

    // Generate URL for version
    savedVersion.url = await this.getFileUrl(savedVersion.filePath);

    return savedVersion;
  }

  // Get versions of a file
  async getVersions(fileId: string, userId: string): Promise<FileVersion[]> {
    // Check if file exists and user has access
    const file = await this.findOne(fileId, userId);

    // Get versions
    const versions = await this.versionRepository.find({
      where: { fileId },
      relations: ['uploadedBy'],
      order: { versionNumber: 'DESC' },
    });

    // Generate URLs
    for (const version of versions) {
      version.url = await this.getFileUrl(version.filePath);
    }

    return versions;
  }

  // Delete a file
  async remove(id: string, userId: string): Promise<boolean> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['versions'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check permissions
    // Only uploader or admin can delete
    if (file.uploadedById !== userId) {
      if (file.workspaceId) {
        const member = await this.workspaceMemberRepository.findOne({
          where: {
            workspaceId: file.workspaceId,
            userId,
            role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
          },
        });

        if (!member) {
          throw new ForbiddenException('You do not have permission to delete this file');
        }
      } else if (file.projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: file.projectId },
          relations: ['workspace'],
        });

        if (!project) {
          throw new NotFoundException('Project not found');
        }

        const member = await this.workspaceMemberRepository.findOne({
          where: {
            workspaceId: project.workspaceId,
            userId,
            role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
          },
        });

        if (!member) {
          throw new ForbiddenException('You do not have permission to delete this file');
        }
      } else {
        throw new ForbiddenException('Only the uploader or an admin can delete this file');
      }
    }

    // Delete all file versions from S3
    if (file.versions) {
      for (const version of file.versions) {
        try {
          await this.s3Service.deleteFile(version.filePath);
        } catch (error) {
          console.error(`Failed to delete file version from S3: ${version.filePath}`, error);
          // Continue with deletion of DB records
        }
      }
    }

    // Delete file record (cascade will delete versions)
    await this.fileRepository.remove(file);

    return true;
  }

  // Helper method to generate file URL
  private async getFileUrl(filePath: string): Promise<string> {
    return this.s3Service.getSignedUrl(filePath, 3600); // 1 hour expiration
  }

  // Helper method to generate preview URL
  private async getPreviewUrl(filePath: string): Promise<string> {
    const previewPath = `previews/${filePath.replace(/\.[^/.]+$/, '.jpg')}`;

    try {
      return this.s3Service.getSignedUrl(previewPath, 3600); // 1 hour expiration
    } catch (error) {
      console.error(`Failed to generate preview URL for: ${filePath}`, error);
      return null;
    }
  }

  // Check if file type supports preview generation
  private canGeneratePreview(fileType: string): boolean {
    const previewableTypes = [
      'image/',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-word',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'text/plain',
    ];

    return previewableTypes.some(type => fileType.startsWith(type));
  }

  // Send notifications about new file versions
  private async notifyAboutNewVersion(file: SharedFile, version: FileVersion, uploaderId: string): Promise<void> {
    // Determine who to notify based on context
    let usersToNotify: string[] = [];

    if (file.workspaceId) {
      // Notify workspace members with editor role or higher
      const members = await this.workspaceMemberRepository.find({
        where: {
          workspaceId: file.workspaceId,
          role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
        },
      });

      usersToNotify = members.map(m => m.userId);
    } else if (file.projectId) {
      // This would need project member retrieval logic
      // For simplicity, we'll notify workspace members associated with the project
      const project = await this.projectRepository.findOne({
        where: { id: file.projectId },
        relations: ['workspace'],
      });

      if (project) {
        const members = await this.workspaceMemberRepository.find({
          where: { workspaceId: project.workspaceId },
        });

        usersToNotify = members.map(m => m.userId);
      }
    } else if (file.taskId) {
      // Notify task assignee and creator
      const task = await this.taskRepository.findOne({
        where: { id: file.taskId },
      });

      if (task) {
        if (task.assignedToId) usersToNotify.push(task.assignedToId);
        if (task.createdById) usersToNotify.push(task.createdById);
      }
    } else if (file.conversationId) {
      // Notify conversation participants
      const participants = await this.conversationParticipantRepository.find({
        where: { conversationId: file.conversationId },
      });

      usersToNotify = participants.map(p => p.userId);
    }

    // Remove uploader from notification list
    usersToNotify = usersToNotify.filter(id => id !== uploaderId);

    // Send notifications
    for (const userId of usersToNotify) {
      await this.notificationsService.create({
        userId,
        type: NotificationType.FILE_UPDATED,
        senderId: uploaderId,
        message: `New version of file "${file.name}" has been uploaded`,
      });
    }
  }
}