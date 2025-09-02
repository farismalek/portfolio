import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2
  ) { }

  // Create a new notification
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const {
      userId,
      type,
      senderId,
      postId,
      commentId,
      portfolioId,
      message
    } = createNotificationDto;

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create notification
    const notification = this.notificationsRepository.create({
      userId,
      type,
      senderId,
      postId,
      commentId,
      portfolioId,
      message,
      isRead: false,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Emit event for real-time notification
    this.eventEmitter.emit('notification.created', savedNotification);

    return savedNotification;
  }

  // Get all notifications for a user
  async findAll(userId: string, pagination?: PaginationInput): Promise<Notification[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.notificationsRepository.find({
      where: { userId },
      relations: ['sender', 'post', 'comment', 'portfolio'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  // Get unread notifications count for a user
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // Mark notifications as read
  async markAsRead(notificationIds: string[], userId: string): Promise<boolean> {
    const notifications = await this.notificationsRepository.find({
      where: {
        id: In(notificationIds),
        userId, // Ensure they belong to this user
      },
    });

    if (notifications.length === 0) {
      return false;
    }

    // Update all selected notifications
    await this.notificationsRepository.update(
      { id: In(notificationIds), userId },
      { isRead: true }
    );

    return true;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );

    return true;
  }

  // Delete a notification
  async remove(id: string, userId: string): Promise<boolean> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId }, // Ensure it belongs to this user
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationsRepository.remove(notification);

    return true;
  }

  // Clear all notifications for a user
  async clearAll(userId: string): Promise<boolean> {
    const notifications = await this.notificationsRepository.find({
      where: { userId },
    });

    if (notifications.length === 0) {
      return false;
    }

    await this.notificationsRepository.remove(notifications);

    return true;
  }

  // Generate notification message based on type
  async generateMessage(notification: Notification): Promise<string> {
    // Load related entities if not already loaded
    if (!notification.sender && notification.senderId) {
      notification.sender = await this.usersRepository.findOne({
        where: { id: notification.senderId }
      });
    }

    const senderName = notification.sender ?
      notification.sender.fullName || notification.sender.username :
      'Someone';

    switch (notification.type) {
      case NotificationType.NEW_FOLLOWER:
        return `${senderName} started following you`;

      case NotificationType.CONNECTION_REQUEST:
        return `${senderName} sent you a connection request`;

      case NotificationType.CONNECTION_ACCEPTED:
        return `${senderName} accepted your connection request`;

      case NotificationType.POST_LIKE:
        return `${senderName} liked your post`;

      case NotificationType.POST_COMMENT:
        return `${senderName} commented on your post`;

      case NotificationType.COMMENT_REPLY:
        return `${senderName} replied to your comment`;

      case NotificationType.POST_SHARE:
        return `${senderName} shared your post`;

      case NotificationType.MENTION:
        return `${senderName} mentioned you in a post`;

      case NotificationType.PORTFOLIO_VIEW:
        return `${senderName} viewed your portfolio`;

      case NotificationType.JOB_APPLICATION:
        return `${senderName} applied to your job posting`;

      default:
        return notification.message || 'You have a new notification';
    }
  }
}