import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationInput } from '../../common/dto/pagination.input';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) { }

  // Create a new comment
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const { userId, postId, content, parentId } = createCommentDto;

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If this is a reply to a comment, check if parent comment exists
    if (parentId) {
      const parentComment = await this.commentsRepository.findOne({ where: { id: parentId } });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Create the comment
    const comment = this.commentsRepository.create({
      userId,
      postId,
      content,
      parentId,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // Process mentions and send notifications
    await this.processMentions(savedComment.id, content, userId);

    // Notify post author (if not self-comment)
    if (post.userId !== userId) {
      await this.notificationsService.create({
        userId: post.userId,
        type: NotificationType.POST_COMMENT,
        senderId: userId,
        postId,
        commentId: savedComment.id,
      });
    }

    // If this is a reply, also notify the parent comment author
    if (parentId) {
      const parentComment = await this.commentsRepository.findOne({ where: { id: parentId } });
      if (parentComment && parentComment.userId !== userId) {
        await this.notificationsService.create({
          userId: parentComment.userId,
          type: NotificationType.COMMENT_REPLY,
          senderId: userId,
          postId,
          commentId: savedComment.id,
        });
      }
    }

    return savedComment;
  }

  // Get a single comment by id
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user', 'user.profiles'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  // Get all comments for a post
  async findByPostId(postId: string, pagination?: PaginationInput): Promise<Comment[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.commentsRepository.find({
      where: { postId, parentId: null }, // Top-level comments only
      relations: ['user', 'user.profiles'],
      skip,
      take,
      order: { createdAt: 'ASC' },
    });
  }

  // Get replies to a comment
  async findReplies(commentId: string, pagination?: PaginationInput): Promise<Comment[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.commentsRepository.find({
      where: { parentId: commentId },
      relations: ['user', 'user.profiles'],
      skip,
      take,
      order: { createdAt: 'ASC' },
    });
  }

  // Update a comment
  async update(id: string, updateCommentDto: UpdateCommentDto, currentUserId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only allow the author to update the comment
    if (comment.userId !== currentUserId) {
      throw new BadRequestException('Not authorized to update this comment');
    }

    const { content } = updateCommentDto;

    // Update the comment
    comment.content = content;
    comment.updatedAt = new Date();

    return this.commentsRepository.save(comment);
  }

  // Delete a comment
  async remove(id: string, currentUserId: string): Promise<boolean> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only allow the comment author or the post author to delete
    const isCommentAuthor = comment.userId === currentUserId;
    const isPostAuthor = comment.post.userId === currentUserId;

    if (!isCommentAuthor && !isPostAuthor) {
      throw new BadRequestException('Not authorized to delete this comment');
    }

    await this.commentsRepository.remove(comment);

    return true;
  }

  // Process mentions from comment content and send notifications
  private async processMentions(commentId: string, content: string, authorId: string): Promise<void> {
    // Extract mentions from content using regex
    const mentionRegex = /@(\w+)/g;
    const matches = content.matchAll(mentionRegex);
    const usernames = [...new Set([...matches].map(match => match[1].toLowerCase()))];

    // If no mentions found, return
    if (usernames.length === 0) {
      return;
    }

    // Find mentioned users
    const mentionedUsers = await this.usersRepository.find({
      where: {
        username: In(usernames),
      },
    });

    // Find comment with post info to include in notification
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['post'],
    });

    if (!comment) return;

    // Send notification to each mentioned user
    for (const user of mentionedUsers) {
      // Don't notify self-mentions
      if (user.id === authorId) {
        continue;
      }

      await this.notificationsService.create({
        userId: user.id,
        type: NotificationType.MENTION,
        senderId: authorId,
        postId: comment.postId,
        commentId,
      });
    }
  }
}