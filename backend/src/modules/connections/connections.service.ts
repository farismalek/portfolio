import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Connection, ConnectionStatus, ConnectionType } from './entities/connection.entity';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { PaginationInput } from '../../common/dto/pagination.input';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private connectionsRepository: Repository<Connection>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    private notificationsService: NotificationsService,
  ) { }

  // Create a new connection (follow or connection request)
  async create(createConnectionDto: CreateConnectionDto): Promise<Connection> {
    const { followerId, followingId, type } = createConnectionDto;

    // Check if users exist
    const follower = await this.usersRepository.findOne({ where: { id: followerId } });
    const following = await this.usersRepository.findOne({ where: { id: followingId } });

    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }

    // Check if users are trying to connect with themselves
    if (followerId === followingId) {
      throw new BadRequestException('Users cannot connect with themselves');
    }

    // Check if connection already exists
    const existingConnection = await this.connectionsRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingConnection) {
      // If blocked, don't allow new connection
      if (existingConnection.status === ConnectionStatus.BLOCKED) {
        throw new ConflictException('Unable to create connection');
      }

      // If already exists with same type, return existing
      if (existingConnection.type === type) {
        return existingConnection;
      }

      // Update type if connection exists but type is different
      existingConnection.type = type;

      // If changing from follow to connection, set status to pending
      if (type === ConnectionType.CONNECTION && existingConnection.status === ConnectionStatus.ACCEPTED) {
        existingConnection.status = ConnectionStatus.PENDING;
      }

      return this.connectionsRepository.save(existingConnection);
    }

    // Create new connection
    const connection = this.connectionsRepository.create({
      followerId,
      followingId,
      type,
      // For follow, automatically accept. For connection, set as pending.
      status: type === ConnectionType.FOLLOW ? ConnectionStatus.ACCEPTED : ConnectionStatus.PENDING,
    });

    const savedConnection = await this.connectionsRepository.save(connection);

    // Update profile stats
    if (type === ConnectionType.FOLLOW && connection.status === ConnectionStatus.ACCEPTED) {
      await this.updateProfileStats(followerId, followingId);
    }

    // Send notification
    if (type === ConnectionType.FOLLOW) {
      await this.notificationsService.create({
        userId: followingId,
        type: NotificationType.NEW_FOLLOWER,
        senderId: followerId,
      });
    } else {
      await this.notificationsService.create({
        userId: followingId,
        type: NotificationType.CONNECTION_REQUEST,
        senderId: followerId,
      });
    }

    return savedConnection;
  }

  // Find all connections for a user
  async findAll(userId: string, paginationInput?: PaginationInput): Promise<Connection[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    return this.connectionsRepository.find({
      where: [
        { followerId: userId },
        { followingId: userId },
      ],
      relations: ['follower', 'following'],
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Get followers of a user
  async getFollowers(userId: string, paginationInput?: PaginationInput): Promise<Connection[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    return this.connectionsRepository.find({
      where: {
        followingId: userId,
        status: ConnectionStatus.ACCEPTED,
      },
      relations: ['follower'],
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Get users that a user is following
  async getFollowing(userId: string, paginationInput?: PaginationInput): Promise<Connection[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    return this.connectionsRepository.find({
      where: {
        followerId: userId,
        status: ConnectionStatus.ACCEPTED,
      },
      relations: ['following'],
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Get connection requests for a user
  async getConnectionRequests(userId: string, paginationInput?: PaginationInput): Promise<Connection[]> {
    const { skip = 0, take = 20 } = paginationInput || {};

    return this.connectionsRepository.find({
      where: {
        followingId: userId,
        status: ConnectionStatus.PENDING,
        type: ConnectionType.CONNECTION,
      },
      relations: ['follower'],
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Update connection status (accept/reject/block)
  async update(id: string, updateConnectionDto: UpdateConnectionDto): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({ where: { id } });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Update connection status
    connection.status = updateConnectionDto.status;

    const updatedConnection = await this.connectionsRepository.save(connection);

    // Update profile stats if accepting a connection
    if (updatedConnection.status === ConnectionStatus.ACCEPTED) {
      await this.updateProfileStats(connection.followerId, connection.followingId);

      // Send notification for accepted connection
      if (connection.type === ConnectionType.CONNECTION) {
        await this.notificationsService.create({
          userId: connection.followerId,
          type: NotificationType.CONNECTION_ACCEPTED,
          senderId: connection.followingId,
        });
      }
    }

    return updatedConnection;
  }

  // Delete a connection
  async remove(id: string): Promise<boolean> {
    const connection = await this.connectionsRepository.findOne({ where: { id } });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Store IDs before deletion for stat updates
    const { followerId, followingId, status } = connection;

    await this.connectionsRepository.remove(connection);

    // Update profile stats if it was an accepted connection
    if (status === ConnectionStatus.ACCEPTED) {
      await this.updateProfileStats(followerId, followingId, true);
    }

    return true;
  }

  // Check if a user is following another user
  async checkFollowStatus(followerId: string, followingId: string): Promise<{
    isFollowing: boolean;
    isPending: boolean;
    isBlocked: boolean;
    connectionId: string | null;
  }> {
    const connection = await this.connectionsRepository.findOne({
      where: { followerId, followingId },
    });

    if (!connection) {
      return {
        isFollowing: false,
        isPending: false,
        isBlocked: false,
        connectionId: null,
      };
    }

    return {
      isFollowing: connection.status === ConnectionStatus.ACCEPTED,
      isPending: connection.status === ConnectionStatus.PENDING,
      isBlocked: connection.status === ConnectionStatus.BLOCKED,
      connectionId: connection.id,
    };
  }

  // Get suggested connections based on mutual connections
  async getSuggestedConnections(userId: string, limit: number = 10): Promise<User[]> {
    // Get current connections
    const currentConnections = await this.connectionsRepository.find({
      where: [
        { followerId: userId, status: ConnectionStatus.ACCEPTED },
        { followingId: userId, status: ConnectionStatus.ACCEPTED },
      ],
    });

    // Extract connected user IDs
    const connectedUserIds = currentConnections.map(conn =>
      conn.followerId === userId ? conn.followingId : conn.followerId
    );

    // Add the current user's ID to exclude from suggestions
    const excludeUserIds = [...connectedUserIds, userId];

    // Find connections of connections
    const connectionsOfConnections = await this.connectionsRepository.find({
      where: [
        { followerId: In(connectedUserIds), status: ConnectionStatus.ACCEPTED },
        { followingId: In(connectedUserIds), status: ConnectionStatus.ACCEPTED },
      ],
    });

    // Count mutual connections and sort by count
    const potentialConnectionsMap = new Map<string, number>();

    for (const conn of connectionsOfConnections) {
      const potentialUserId = conn.followerId === userId || conn.followingId === userId
        ? null // Skip self
        : conn.followerId === connectedUserIds.find(id => id === conn.followerId)
          ? conn.followingId
          : conn.followerId;

      // Skip if null or in exclude list
      if (!potentialUserId || excludeUserIds.includes(potentialUserId)) {
        continue;
      }

      const currentCount = potentialConnectionsMap.get(potentialUserId) || 0;
      potentialConnectionsMap.set(potentialUserId, currentCount + 1);
    }

    // Sort by mutual connection count and limit results
    const sortedPotentialUserIds = [...potentialConnectionsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);

    // Get user details for suggested connections
    if (sortedPotentialUserIds.length === 0) {
      return [];
    }

    return this.usersRepository.find({
      where: { id: In(sortedPotentialUserIds) },
      relations: ['profiles'],
    });
  }

  // Get mutual connections between two users
  async getMutualConnections(user1Id: string, user2Id: string, limit: number = 5): Promise<User[]> {
    // Get first user's connections
    const user1Connections = await this.connectionsRepository.find({
      where: [
        { followerId: user1Id, status: ConnectionStatus.ACCEPTED },
        { followingId: user1Id, status: ConnectionStatus.ACCEPTED },
      ],
    });

    // Get second user's connections
    const user2Connections = await this.connectionsRepository.find({
      where: [
        { followerId: user2Id, status: ConnectionStatus.ACCEPTED },
        { followingId: user2Id, status: ConnectionStatus.ACCEPTED },
      ],
    });

    // Extract connected user IDs for both users
    const user1ConnectedIds = user1Connections.map(conn =>
      conn.followerId === user1Id ? conn.followingId : conn.followerId
    );

    const user2ConnectedIds = user2Connections.map(conn =>
      conn.followerId === user2Id ? conn.followingId : conn.followerId
    );

    // Find mutual connections
    const mutualConnectionIds = user1ConnectedIds.filter(id =>
      user2ConnectedIds.includes(id)
    ).slice(0, limit);

    if (mutualConnectionIds.length === 0) {
      return [];
    }

    // Get user details for mutual connections
    return this.usersRepository.find({
      where: { id: In(mutualConnectionIds) },
      relations: ['profiles'],
    });
  }

  // Update profile stats when connections change
  private async updateProfileStats(followerId: string, followingId: string, isRemove: boolean = false): Promise<void> {
    // Get default profiles for both users
    const followerProfile = await this.profilesRepository.findOne({
      where: {
        userId: followerId,
        isDefault: true,
      }
    });

    const followingProfile = await this.profilesRepository.findOne({
      where: {
        userId: followingId,
        isDefault: true,
      }
    });

    // Update stats based on connection type
    if (followerProfile) {
      followerProfile.followingCount += isRemove ? -1 : 1;
      await this.profilesRepository.save(followerProfile);
    }

    if (followingProfile) {
      followingProfile.followerCount += isRemove ? -1 : 1;
      await this.profilesRepository.save(followingProfile);
    }
  }
}