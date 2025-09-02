import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserPresence } from './entities/user-presence.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserPresenceService {
  private readonly onlineUsers = new Map<string, Date>();

  constructor(
    @InjectRepository(UserPresence)
    private userPresenceRepository: Repository<UserPresence>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) { }

  async getUserStatus(userId: string): Promise<'online' | 'offline' | 'away'> {
    if (this.onlineUsers.has(userId)) {
      return 'online';
    }

    // Check database for last activity
    const presence = await this.userPresenceRepository.findOne({
      where: { userId },
    });

    if (!presence) {
      return 'offline';
    }

    const now = new Date();
    const lastActive = new Date(presence.lastActiveAt);
    const minutesSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    // If active in the last 10 minutes, consider "away"
    if (minutesSinceActive < 10) {
      return 'away';
    }

    return 'offline';
  }

  async setUserOnline(userId: string): Promise<void> {
    const now = new Date();
    this.onlineUsers.set(userId, now);

    // Update last active in database
    await this.updateUserPresence(userId, now);

    // Emit event
    this.eventEmitter.emit('user.presence.online', { userId, timestamp: now });
  }

  async setUserOffline(userId: string): Promise<void> {
    const now = new Date();
    this.onlineUsers.delete(userId);

    // Update last active in database
    await this.updateUserPresence(userId, now);

    // Emit event
    this.eventEmitter.emit('user.presence.offline', { userId, timestamp: now });
  }

  async updateActivity(userId: string): Promise<void> {
    const now = new Date();
    if (this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, now);
    }

    // Update last active in database (less frequently to reduce DB writes)
    const lastUpdated = await this.getLastUpdateTime(userId);
    if (!lastUpdated || (now.getTime() - lastUpdated.getTime()) > 5 * 60 * 1000) { // 5 minutes
      await this.updateUserPresence(userId, now);
    }
  }

  async getLastUpdateTime(userId: string): Promise<Date | null> {
    const presence = await this.userPresenceRepository.findOne({
      where: { userId },
    });
    return presence ? presence.lastActiveAt : null;
  }

  async getUsersStatus(userIds: string[]): Promise<Record<string, 'online' | 'offline' | 'away'>> {
    const result: Record<string, 'online' | 'offline' | 'away'> = {};

    // Check online status from memory for all users
    for (const userId of userIds) {
      result[userId] = this.onlineUsers.has(userId) ? 'online' : 'offline';
    }

    // For users not online, check database for "away" status
    const offlineUserIds = userIds.filter(id => result[id] === 'offline');

    if (offlineUserIds.length > 0) {
      const presences = await this.userPresenceRepository.find({
        where: { userId: In(offlineUserIds) },
      });

      const now = new Date();
      for (const presence of presences) {
        const lastActive = new Date(presence.lastActiveAt);
        const minutesSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60);

        if (minutesSinceActive < 10) {
          result[presence.userId] = 'away';
        }
      }
    }

    return result;
  }

  private async updateUserPresence(userId: string, timestamp: Date): Promise<void> {
    let presence = await this.userPresenceRepository.findOne({
      where: { userId },
    });

    if (!presence) {
      presence = this.userPresenceRepository.create({
        userId,
        lastActiveAt: timestamp,
      });
    } else {
      presence.lastActiveAt = timestamp;
    }

    await this.userPresenceRepository.save(presence);
  }
}