import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType, MessageStatus } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReadReceipt } from './entities/message-read-receipt.entity';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { MessagingGateway } from './messaging.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { SharedFilesService } from '../files/shared-files.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(MessageReaction)
    private reactionRepository: Repository<MessageReaction>,
    @InjectRepository(MessageReadReceipt)
    private readReceiptRepository: Repository<MessageReadReceipt>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private messagingGateway: MessagingGateway,
    private notificationsService: NotificationsService,
    private sharedFilesService: SharedFilesService,
  ) { }

  // Create a new message
  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const { conversationId, senderId, content, type, media, parentId, metadata } = createMessageDto;

    // Check if conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(p => p.userId === senderId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Check if parent message exists if provided
    if (parentId) {
      const parentMessage = await this.messageRepository.findOne({
        where: { id: parentId, conversationId },
      });

      if (!parentMessage) {
        throw new NotFoundException('Parent message not found');
      }
    }

    // Create the message
    const message = this.messageRepository.create({
      conversationId,
      senderId,
      content,
      type: type || MessageType.TEXT,
      media,
      parentId,
      metadata,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation last message timestamp
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // If this is a file message, create shared file record
    if ((type === MessageType.FILE || type === MessageType.IMAGE) && media) {
      await this.sharedFilesService.createFromMessage(savedMessage);
    }

    // Load sender for response
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });

    // Notify participants about new message
    const participantIds = conversation.participants
      .filter(p => p.userId !== senderId)
      .map(p => p.userId);

    this.messagingGateway.notifyNewMessage(messageWithSender, participantIds);

    // Send notifications to participants who are not online
    for (const participantId of participantIds) {
      const participant = conversation.participants.find(p => p.userId === participantId);
      if (participant && !participant.isMuted) {
        await this.notificationsService.create({
          userId: participantId,
          type: NotificationType.NEW_MESSAGE,
          senderId,
          conversationId,
          messageId: messageWithSender.id,
        });
      }
    }

    return messageWithSender;
  }

  // Get a single message
  async findOne(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'reactions', 'reactions.user', 'readReceipts', 'readReceipts.user'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  // Get messages for a conversation
  async findByConversation(conversationId: string, userId: string, paginationInput?: PaginationInput): Promise<Message[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    // Check if user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Get messages
    const messages = await this.messageRepository.find({
      where: { conversationId, parentId: null },
      relations: ['sender', 'reactions', 'readReceipts'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    // Mark conversation as read
    participant.lastReadAt = new Date();
    await this.participantRepository.save(participant);

    // Process messages
    return messages.map(message => {
      // Calculate counts
      message.reactionCount = message.reactions?.length || 0;
      message.isRead = message.readReceipts?.some(r => r.userId === userId) || false;

      return message;
    });
  }

  // Get thread messages
  async findThreadMessages(parentId: string, userId: string, paginationInput?: PaginationInput): Promise<Message[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    // Check if parent message exists
    const parentMessage = await this.messageRepository.findOne({
      where: { id: parentId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!parentMessage) {
      throw new NotFoundException('Parent message not found');
    }

    // Check if user is participant
    const isParticipant = parentMessage.conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Get thread messages
    const messages = await this.messageRepository.find({
      where: { parentId },
      relations: ['sender', 'reactions', 'readReceipts'],
      order: { createdAt: 'ASC' },
      skip,
      take,
    });

    // Process messages
    return messages.map(message => {
      // Calculate counts
      message.reactionCount = message.reactions?.length || 0;
      message.isRead = message.readReceipts?.some(r => r.userId === userId) || false;

      return message;
    });
  }

  // Update a message
  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
    const { content } = updateMessageDto;

    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can update message
    if (message.senderId !== userId) {
      throw new ForbiddenException('Only the sender can update this message');
    }

    // Cannot update system messages
    if (message.type === MessageType.SYSTEM) {
      throw new ForbiddenException('Cannot update system messages');
    }

    // Cannot update deleted messages
    if (message.isDeleted) {
      throw new ForbiddenException('Cannot update deleted messages');
    }

    message.content = content;
    message.isEdited = true;
    message.updatedAt = new Date();

    const updatedMessage = await this.messageRepository.save(message);

    // Notify participants
    const participantIds = message.conversation.participants
      .filter(p => p.userId !== userId)
      .map(p => p.userId);

    this.messagingGateway.notifyMessageUpdated(updatedMessage, participantIds);

    return this.findOne(id);
  }

  // Delete a message (soft delete)
  async remove(id: string, userId: string): Promise<boolean> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete message
    if (message.senderId !== userId) {
      throw new ForbiddenException('Only the sender can delete this message');
    }

    // Cannot delete system messages
    if (message.type === MessageType.SYSTEM) {
      throw new ForbiddenException('Cannot delete system messages');
    }

    // Soft delete
    message.isDeleted = true;
    message.content = 'This message was deleted';

    await this.messageRepository.save(message);

    // Notify participants
    const participantIds = message.conversation.participants
      .filter(p => p.userId !== userId)
      .map(p => p.userId);

    this.messagingGateway.notifyMessageDeleted(message.id, message.conversationId, participantIds);

    return true;
  }

  // React to a message
  async createReaction(createReactionDto: CreateReactionDto): Promise<MessageReaction> {
    const { messageId, userId, reaction } = createReactionDto;

    // Check if message exists
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is participant
    const isParticipant = message.conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Check if reaction already exists
    const existingReaction = await this.reactionRepository.findOne({
      where: {
        messageId,
        userId,
        reaction,
      },
    });

    if (existingReaction) {
      // Remove reaction if it already exists (toggle behavior)
      await this.reactionRepository.remove(existingReaction);

      // Notify participants
      const participantIds = message.conversation.participants.map(p => p.userId);
      this.messagingGateway.notifyReactionRemoved(messageId, userId, reaction, participantIds);

      return null;
    }

    // Create reaction
    const newReaction = this.reactionRepository.create({
      messageId,
      userId,
      reaction,
    });

    const savedReaction = await this.reactionRepository.save(newReaction);

    // Notify participants
    const participantIds = message.conversation.participants.map(p => p.userId);
    this.messagingGateway.notifyReactionAdded(savedReaction, participantIds);

    // If not the sender, notify them about the reaction
    if (message.senderId !== userId && message.senderId) {
      await this.notificationsService.create({
        userId: message.senderId,
        type: NotificationType.MESSAGE_REACTION,
        senderId: userId,
        conversationId: message.conversationId,
        messageId,
      });
    }

    return savedReaction;
  }

  // Mark a message as read
  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    // Check if message exists
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is participant
    const isParticipant = message.conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Check if already marked as read
    const existingReceipt = await this.readReceiptRepository.findOne({
      where: {
        messageId,
        userId,
      },
    });

    if (existingReceipt) {
      return true;
    }

    // Create read receipt
    const readReceipt = this.readReceiptRepository.create({
      messageId,
      userId,
      readAt: new Date(),
    });

    await this.readReceiptRepository.save(readReceipt);

    // Notify sender if message now read by everyone
    if (message.senderId) {
      const participantCount = message.conversation.participants.length;
      const readReceiptsCount = await this.readReceiptRepository.count({
        where: { messageId },
      });

      if (readReceiptsCount === participantCount - 1) { // All participants except sender
        this.messagingGateway.notifyMessageReadByAll(messageId, message.senderId);
      }
    }

    return true;
  }
}