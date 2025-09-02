import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsResponse,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { JwtService } from '@nestjs/jwt';
import { UserPresenceService } from '../users/user-presence.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly connectedClients: Map<string, Set<string>> = new Map();

  constructor(
    @Inject(forwardRef(() => ConversationsService))
    private conversationsService: ConversationsService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    private jwtService: JwtService,
    private userPresenceService: UserPresenceService,
  ) { }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store client connection
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      this.connectedClients.get(userId).add(client.id);

      // Join user to their user-specific room
      client.join(`user:${userId}`);

      // Join conversations
      const conversations = await this.conversationsService.findAllForUser(userId);
      conversations.forEach((conversation) => {
        client.join(`conversation:${conversation.id}`);
      });

      // Update user presence status
      await this.userPresenceService.setUserOnline(userId);

      // Store userId in socket data for easy access
      client.data.userId = userId;

      // Notify user's connections about online status
      this.server.emit('user:status', { userId, status: 'online' });

    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data.userId;
    if (!userId) return;

    // Remove client connection
    if (this.connectedClients.has(userId)) {
      const connections = this.connectedClients.get(userId);
      connections.delete(client.id);

      // If no more connections for this user, update presence
      if (connections.size === 0) {
        await this.userPresenceService.setUserOffline(userId);
        this.connectedClients.delete(userId);

        // Notify user's connections about offline status
        this.server.emit('user:status', { userId, status: 'offline' });
      }
    }
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      // Check if user is participant
      const conversation = await this.conversationsService.findOne(data.conversationId);
      const isParticipant = conversation.participants.some(p => p.userId === userId);

      if (isParticipant) {
        client.join(`conversation:${data.conversationId}`);
      }
    } catch (error) {
      // Ignore if conversation not found or user not participant
    }
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): void {
    client.leave(`conversation:${data.conversationId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ): Promise<WsResponse<Message>> {
    const userId = client.data.userId;
    if (userId !== createMessageDto.senderId) {
      throw new Error('Unauthorized');
    }

    const message = await this.messagesService.create(createMessageDto);
    return { event: 'message:new', data: message };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:reaction')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() createReactionDto: CreateReactionDto,
  ): Promise<WsResponse<MessageReaction | null>> {
    const userId = client.data.userId;
    if (userId !== createReactionDto.userId) {
      throw new Error('Unauthorized');
    }

    const reaction = await this.messagesService.createReaction(createReactionDto);
    return { event: reaction ? 'message:reaction:add' : 'message:reaction:remove', data: reaction };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:read')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) return;

    await this.messagesService.markAsRead(data.messageId, userId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) return;

    // Notify other participants that user is typing
    client.to(`conversation:${data.conversationId}`).emit('user:typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: true
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) return;

    // Notify other participants that user stopped typing
    client.to(`conversation:${data.conversationId}`).emit('user:typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: false
    });
  }

  // Helper methods for other services to emit events

  notifyNewConversation(conversation: Conversation, userIds: string[]): void {
    userIds.forEach(userId => {
      this.server.to(`user:${userId}`).emit('conversation:new', conversation);
    });
  }

  notifyConversationUpdated(conversation: Conversation, userIds: string[]): void {
    this.server.to(`conversation:${conversation.id}`).emit('conversation:updated', conversation);
  }

  notifyConversationDeleted(conversationId: string, userIds: string[]): void {
    userIds.forEach(userId => {
      this.server.to(`user:${userId}`).emit('conversation:deleted', { id: conversationId });
    });
  }

  notifyParticipantsAdded(conversation: Conversation, newParticipantIds: string[], allParticipantIds: string[]): void {
    // Notify existing participants
    this.server.to(`conversation:${conversation.id}`).emit('conversation:participants:added', {
      conversationId: conversation.id,
      participants: conversation.participants.filter(p => newParticipantIds.includes(p.userId))
    });

    // Notify new participants about the conversation
    newParticipantIds.forEach(userId => {
      this.server.to(`user:${userId}`).emit('conversation:new', conversation);
    });
  }

  notifyParticipantRemoved(conversation: Conversation, removedUserId: string, remainingParticipantIds: string[]): void {
    // Notify remaining participants
    this.server.to(`conversation:${conversation.id}`).emit('conversation:participant:removed', {
      conversationId: conversation.id,
      userId: removedUserId
    });

    // Notify removed user
    this.server.to(`user:${removedUserId}`).emit('conversation:removed', {
      conversationId: conversation.id
    });
  }

  notifyParticipantUpdated(conversation: Conversation, participant: ConversationParticipant): void {
    this.server.to(`conversation:${conversation.id}`).emit('conversation:participant:updated', {
      conversationId: conversation.id,
      participant
    });
  }

  notifyNewMessage(message: Message, recipientIds: string[]): void {
    this.server.to(`conversation:${message.conversationId}`).emit('message:new', message);
  }

  notifyMessageUpdated(message: Message, recipientIds: string[]): void {
    this.server.to(`conversation:${message.conversationId}`).emit('message:updated', message);
  }

  notifyMessageDeleted(messageId: string, conversationId: string, recipientIds: string[]): void {
    this.server.to(`conversation:${conversationId}`).emit('message:deleted', {
      id: messageId,
      conversationId
    });
  }

  notifyReactionAdded(reaction: MessageReaction, userIds: string[]): void {
    this.server.to(`conversation:${reaction.message.conversationId}`).emit('message:reaction:add', reaction);
  }

  notifyReactionRemoved(messageId: string, userId: string, reactionType: string, recipientIds: string[]): void {
    this.server.to(`conversation:${messageId}`).emit('message:reaction:remove', {
      messageId,
      userId,
      reaction: reactionType
    });
  }

  notifyMessageReadByAll(messageId: string, senderId: string): void {
    this.server.to(`user:${senderId}`).emit('message:read:all', { messageId });
  }
}