import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { ConversationParticipant, ParticipantRole } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private messagingGateway: MessagingGateway,
  ) { }

  // Create a new conversation
  async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const { type, title, createdById, participantIds, metadata } = createConversationDto;

    // Validate user exists
    const creator = await this.userRepository.findOne({ where: { id: createdById } });
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    // For direct conversations, ensure there are exactly 2 participants
    if (type === ConversationType.DIRECT) {
      if (participantIds.length !== 1) {
        throw new BadRequestException('Direct conversations must have exactly one recipient');
      }

      // Check if direct conversation already exists between these users
      const existingConversation = await this.findDirectConversation(createdById, participantIds[0]);
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create the conversation
    const conversation = this.conversationRepository.create({
      type,
      title: type === ConversationType.DIRECT ? null : title,
      createdById,
      metadata,
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // Add creator as participant and admin
    const creatorParticipant = this.participantRepository.create({
      conversationId: savedConversation.id,
      userId: createdById,
      role: ParticipantRole.ADMIN,
    });

    await this.participantRepository.save(creatorParticipant);

    // Add other participants
    const participants = participantIds.map(userId => {
      return this.participantRepository.create({
        conversationId: savedConversation.id,
        userId,
        role: ParticipantRole.MEMBER,
      });
    });

    if (participants.length > 0) {
      await this.participantRepository.save(participants);
    }

    // Notify participants about new conversation
    this.messagingGateway.notifyNewConversation(savedConversation, [createdById, ...participantIds]);

    return this.findOne(savedConversation.id);
  }

  // Find a direct conversation between two users
  async findDirectConversation(userOneId: string, userTwoId: string): Promise<Conversation | null> {
    const userOneParticipations = await this.participantRepository.find({
      where: { userId: userOneId },
      relations: ['conversation'],
    });

    const directConversationIds = userOneParticipations
      .filter(p => p.conversation.type === ConversationType.DIRECT)
      .map(p => p.conversationId);

    if (directConversationIds.length === 0) {
      return null;
    }

    const userTwoParticipation = await this.participantRepository.findOne({
      where: {
        userId: userTwoId,
        conversationId: In(directConversationIds),
      },
      relations: ['conversation'],
    });

    if (!userTwoParticipation) {
      return null;
    }

    return this.findOne(userTwoParticipation.conversationId);
  }

  // Get a single conversation by ID
  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['participants', 'participants.user'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Get last message
    const lastMessage = await this.messageRepository.findOne({
      where: { conversationId: id },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });

    conversation.lastMessage = lastMessage;

    return conversation;
  }

  // Get all conversations for a user
  async findAllForUser(userId: string, paginationInput?: PaginationInput): Promise<Conversation[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    // Get all conversations where user is participant
    const participations = await this.participantRepository.find({
      where: { userId },
      relations: ['conversation'],
    });

    const conversationIds = participations.map(p => p.conversationId);

    if (conversationIds.length === 0) {
      return [];
    }

    // Get conversations with participants
    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) },
      relations: ['participants', 'participants.user'],
      order: { lastMessageAt: 'DESC' },
      skip,
      take,
    });

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { conversationId: conversation.id },
          relations: ['sender'],
          order: { createdAt: 'DESC' },
        });

        // Count unread messages
        const participant = conversation.participants.find(p => p.userId === userId);

        const unreadCount = participant
          ? await this.messageRepository.count({
            where: {
              conversationId: conversation.id,
              createdAt: participant ? participant.lastReadAt : undefined,
              senderId: Not(userId),
            },
          })
          : 0;

        return {
          ...conversation,
          lastMessage,
          unreadCount,
        };
      })
    );

    return conversationsWithLastMessage;
  }

  // Update a conversation
  async update(id: string, updateConversationDto: UpdateConversationDto, userId: string): Promise<Conversation> {
    const conversation = await this.findOne(id);

    // Check if user is admin
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException('Only admins can update the conversation');
    }

    // Direct conversations can't be updated
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Direct conversations cannot be updated');
    }

    const { title, metadata } = updateConversationDto;

    if (title !== undefined) {
      conversation.title = title;
    }

    if (metadata !== undefined) {
      conversation.metadata = { ...conversation.metadata, ...metadata };
    }

    const updatedConversation = await this.conversationRepository.save(conversation);

    // Notify participants
    const participantIds = conversation.participants.map(p => p.userId);
    this.messagingGateway.notifyConversationUpdated(updatedConversation, participantIds);

    return this.findOne(id);
  }

  // Add participants to a conversation
  async addParticipants(id: string, addParticipantsDto: AddParticipantsDto, userId: string): Promise<Conversation> {
    const { participantIds } = addParticipantsDto;
    const conversation = await this.findOne(id);

    // Check if user is admin
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException('Only admins can add participants');
    }

    // Direct conversations can't have more participants
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot add participants to direct conversations');
    }

    // Filter out users already in the conversation
    const existingParticipantIds = conversation.participants.map(p => p.userId);
    const newParticipantIds = participantIds.filter(id => !existingParticipantIds.includes(id));

    if (newParticipantIds.length === 0) {
      return conversation;
    }

    // Create new participant records
    const newParticipants = newParticipantIds.map(participantId => {
      return this.participantRepository.create({
        conversationId: id,
        userId: participantId,
        role: ParticipantRole.MEMBER,
      });
    });

    await this.participantRepository.save(newParticipants);

    // Create system message
    const addedUsers = await this.userRepository.find({ where: { id: In(newParticipantIds) } });
    const addedUsernames = addedUsers.map(u => u.username).join(', ');

    await this.messageRepository.save({
      conversationId: id,
      type: MessageType.SYSTEM,
      content: `${addedUsernames} joined the conversation`,
    });

    // Notify all participants including new ones
    const updatedConversation = await this.findOne(id);
    const allParticipantIds = updatedConversation.participants.map(p => p.userId);
    this.messagingGateway.notifyParticipantsAdded(updatedConversation, newParticipantIds, allParticipantIds);

    return updatedConversation;
  }

  // Update a participant's role
  async updateParticipant(id: string, participantId: string, updateParticipantDto: UpdateParticipantDto, userId: string): Promise<ConversationParticipant> {
    const conversation = await this.findOne(id);

    // Check if user is admin
    const requesterParticipant = conversation.participants.find(p => p.userId === userId);
    if (!requesterParticipant || requesterParticipant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException('Only admins can update participant roles');
    }

    // Find the participant to update
    const participantToUpdate = conversation.participants.find(p => p.id === participantId);
    if (!participantToUpdate) {
      throw new NotFoundException('Participant not found');
    }

    const { role, isMuted, isArchived } = updateParticipantDto;

    if (role !== undefined) {
      participantToUpdate.role = role;
    }

    if (isMuted !== undefined) {
      participantToUpdate.isMuted = isMuted;
    }

    if (isArchived !== undefined) {
      participantToUpdate.isArchived = isArchived;
    }

    const updatedParticipant = await this.participantRepository.save(participantToUpdate);

    // Notify participant about role change
    if (role !== undefined) {
      this.messagingGateway.notifyParticipantUpdated(conversation, updatedParticipant);
    }

    return updatedParticipant;
  }

  // Remove a participant from a conversation
  async removeParticipant(id: string, participantUserId: string, userId: string): Promise<boolean> {
    const conversation = await this.findOne(id);

    // Check permissions
    const requesterParticipant = conversation.participants.find(p => p.userId === userId);
    if (!requesterParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Users can remove themselves, admins can remove anyone
    if (participantUserId !== userId && requesterParticipant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException('Only admins can remove other participants');
    }

    // Direct conversations cannot have participants removed
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot remove participants from direct conversations');
    }

    // Find the participant to remove
    const participantToRemove = conversation.participants.find(p => p.userId === participantUserId);
    if (!participantToRemove) {
      throw new NotFoundException('Participant not found');
    }

    // Remove the participant
    await this.participantRepository.remove(participantToRemove);

    // Create system message
    const removedUser = await this.userRepository.findOne({ where: { id: participantUserId } });

    await this.messageRepository.save({
      conversationId: id,
      type: MessageType.SYSTEM,
      content: participantUserId === userId
        ? `${removedUser.username} left the conversation`
        : `${removedUser.username} was removed from the conversation`,
    });

    // Notify remaining participants
    const remainingParticipantIds = conversation.participants
      .filter(p => p.userId !== participantUserId)
      .map(p => p.userId);

    this.messagingGateway.notifyParticipantRemoved(conversation, participantUserId, remainingParticipantIds);

    return true;
  }

  // Mark conversation as read for a user
  async markAsRead(id: string, userId: string): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      where: {
        conversationId: id,
        userId,
      },
    });

    if (!participant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Update last read timestamp
    participant.lastReadAt = new Date();
    await this.participantRepository.save(participant);

    // Update read receipts for messages
    const messages = await this.messageRepository.find({
      where: {
        conversationId: id,
        createdAt: participant.lastReadAt,
        senderId: Not(userId),
      },
    });

    for (const message of messages) {
      await this.messageService.markAsRead(message.id, userId);
    }

    return true;
  }

  // Delete a conversation
  async remove(id: string, userId: string): Promise<boolean> {
    const conversation = await this.findOne(id);

    // Check if user is admin
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== ParticipantRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete conversations');
    }

    // Direct conversations cannot be deleted, only archived
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Direct conversations cannot be deleted, only archived');
    }

    // Get all participant IDs for notification
    const participantIds = conversation.participants.map(p => p.userId);

    // Delete the conversation and all related records
    await this.conversationRepository.remove(conversation);

    // Notify participants
    this.messagingGateway.notifyConversationDeleted(id, participantIds);

    return true;
  }
}