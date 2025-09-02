import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Connection, ConnectionStatus } from '../connections/entities/connection.entity';
import { FeedPreference } from './entities/feed-preference.entity';
import { User } from '../users/entities/user.entity';
import { PaginationInput } from '../../common/dto/pagination.input';
import { FeedItemDto } from './dto/feed-item.dto';
import { UpdateFeedPreferencesDto } from './dto/update-feed-preferences.dto';
import { Reaction } from '../posts/entities/reaction.entity';
import { Comment } from '../posts/entities/comment.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Connection)
    private connectionsRepository: Repository<Connection>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FeedPreference)
    private feedPreferencesRepository: Repository<FeedPreference>,
    @InjectRepository(Reaction)
    private reactionsRepository: Repository<Reaction>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) { }

  // Generate personalized feed for a user
  async getPersonalizedFeed(userId: string, pagination?: PaginationInput): Promise<FeedItemDto[]> {
    const { skip = 0, take = 20 } = pagination || {};

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's feed preferences
    const preferences = await this.getFeedPreferences(userId);

    // Get user's connections (people they follow)
    const connections = await this.connectionsRepository.find({
      where: {
        followerId: userId,
        status: ConnectionStatus.ACCEPTED,
      },
    });

    const followingIds = connections.map(connection => connection.followingId);

    // Calculate content weights for personalization
    const contentWeights = await this.calculateContentWeights(userId, followingIds);

    // Base query for personalized feed
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile', 'profile.isDefault = :isDefault', { isDefault: true })
      .leftJoinAndSelect('post.reactions', 'reactions')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .loadRelationCountAndMap('post.shareCount', 'post.shares')
      .where('post.parentId IS NULL') // Only top-level posts
      .andWhere('post.status = :status', { status: 'published' })
      .andWhere('post.createdAt > :minDate', { minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }); // Last 30 days

    // Apply content type filtering if specified in preferences
    if (preferences.preferredContentTypes && preferences.preferredContentTypes.length > 0) {
      queryBuilder.andWhere('post.type IN (:...types)', { types: preferences.preferredContentTypes });
    }

    // Apply hidden users filter
    if (preferences.hiddenUsers && preferences.hiddenUsers.length > 0) {
      queryBuilder.andWhere('post.userId NOT IN (:...hiddenUsers)', { hiddenUsers: preferences.hiddenUsers });
    }

    // Apply hidden tags filter
    if (preferences.hiddenTags && preferences.hiddenTags.length > 0) {
      queryBuilder.andWhere(`
        NOT EXISTS (
          SELECT 1 FROM post_hashtags ph
          WHERE ph.postId = post.id AND ph.hashtagId IN (:...hiddenTags)
        )
      `, { hiddenTags: preferences.hiddenTags });
    }

    // Include posts from connections and popular public posts
    queryBuilder.andWhere(`
      (
        post.userId IN (:...followingIds)
        OR
        (
          post.visibility = 'public'
          AND (
            post.viewCount > 50
            OR EXISTS (SELECT 1 FROM reactions r WHERE r.postId = post.id GROUP BY r.postId HAVING COUNT(r.id) > 5)
          )
        )
      )
    `, { followingIds: [...followingIds, userId] });

    // Prioritize certain users if specified
    if (preferences.prioritizedUsers && preferences.prioritizedUsers.length > 0) {
      queryBuilder.orderBy(`
        CASE WHEN post.userId IN (:...prioritizedUsers) THEN 1 ELSE 0 END
      `, 'DESC', { prioritizedUsers: preferences.prioritizedUsers });
    }

    // Get posts with base ordering
    const posts = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(take * 2) // Get more than needed for better personalization
      .getMany();

    // Calculate personalization score for each post
    const scoredPosts = posts.map(post => {
      let score = 0;

      // Base time decay (newer posts score higher)
      const hoursAgo = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const timeScore = Math.max(0, 1 - (hoursAgo / (24 * 7))); // Time decay over a week
      score += timeScore * 10;

      // Engagement score
      const reactionCount = post.reactions?.length || 0;
      const commentCount = post.commentCount || 0;
      const shareCount = post.shareCount || 0;
      const viewCount = post.viewCount || 0;

      const engagementScore =
        (reactionCount * 1) +
        (commentCount * 2) +
        (shareCount * 3) +
        (viewCount * 0.1);
      score += Math.min(10, engagementScore / 5);

      // Content type preference (from user's calculated weights)
      const typeWeight = contentWeights.types[post.type] || 1;
      score *= typeWeight;

      // Connection strength (prioritize closer connections)
      const connectionWeight = contentWeights.users[post.userId] || 1;
      score *= connectionWeight;

      return { post, score };
    });

    // Sort by score (highest first) and limit to requested amount
    scoredPosts.sort((a, b) => b.score - a.score);
    const topPosts = scoredPosts.slice(0, take);

    // Map to DTO
    return topPosts.map(({ post }) => {
      // Check if current user has reacted
      const hasReacted = post.reactions?.some(reaction => reaction.userId === userId) || false;

      return {
        id: post.id,
        user: post.user,
        content: post.content,
        title: post.title,
        type: post.type,
        media: post.media,
        createdAt: post.createdAt,
        reactionCount: post.reactions?.length || 0,
        commentCount: post.commentCount || 0,
        hasReacted,
      };
    });
  }

  // Get trending posts for the discovery feed
  async getDiscoveryFeed(userId: string, pagination?: PaginationInput): Promise<FeedItemDto[]> {
    const { skip = 0, take = 20 } = pagination || {};

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's feed preferences
    const preferences = await this.getFeedPreferences(userId);

    // Query for trending content
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile', 'profile.isDefault = :isDefault', { isDefault: true })
      .leftJoinAndSelect('post.reactions', 'reactions')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .loadRelationCountAndMap('post.shareCount', 'post.shares')
      .where('post.parentId IS NULL') // Only top-level posts
      .andWhere('post.status = :status', { status: 'published' })
      .andWhere('post.visibility = :visibility', { visibility: 'public' })
      .andWhere('post.createdAt > :minDate', { minDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }); // Last 7 days

    // Apply content type filtering if specified in preferences
    if (preferences.preferredContentTypes && preferences.preferredContentTypes.length > 0) {
      queryBuilder.andWhere('post.type IN (:...types)', { types: preferences.preferredContentTypes });
    }

    // Apply hidden users filter
    if (preferences.hiddenUsers && preferences.hiddenUsers.length > 0) {
      queryBuilder.andWhere('post.userId NOT IN (:...hiddenUsers)', { hiddenUsers: preferences.hiddenUsers });
    }

    // Order by engagement score with recency factor
    queryBuilder.orderBy(`
      (
        (SELECT COUNT(*) FROM reactions WHERE reactions.postId = post.id) * 5 + 
        (SELECT COUNT(*) FROM posts comments WHERE comments.parentId = post.id) * 10 +
        post.viewCount * 0.5
      ) / (EXTRACT(EPOCH FROM (NOW() - post.createdAt)) / 3600 + 1)
    `, 'DESC');

    const posts = await queryBuilder
      .skip(skip)
      .take(take)
      .getMany();

    // Map to DTO
    return posts.map(post => {
      // Check if current user has reacted
      const hasReacted = post.reactions?.some(reaction => reaction.userId === userId) || false;

      return {
        id: post.id,
        user: post.user,
        content: post.content,
        title: post.title,
        type: post.type,
        media: post.media,
        createdAt: post.createdAt,
        reactionCount: post.reactions?.length || 0,
        commentCount: post.commentCount || 0,
        hasReacted,
      };
    });
  }

  // Get or create feed preferences for a user
  async getFeedPreferences(userId: string): Promise<FeedPreference> {
    // Try to find existing preferences
    let preferences = await this.feedPreferencesRepository.findOne({
      where: { userId },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = this.feedPreferencesRepository.create({
        userId,
        preferredContentTypes: [
          'text', 'image', 'gallery', 'video', 'article', 'portfolio', 'project', 'job'
        ],
        hiddenUsers: [],
        prioritizedUsers: [],
        hiddenTags: [],
        prioritizedTags: [],
      });

      await this.feedPreferencesRepository.save(preferences);
    }

    return preferences;
  }

  // Update feed preferences
  async updateFeedPreferences(userId: string, updateDto: UpdateFeedPreferencesDto): Promise<FeedPreference> {
    // Get current preferences
    const preferences = await this.getFeedPreferences(userId);

    // Update preferences with new values
    const {
      preferredContentTypes,
      hiddenUsers,
      prioritizedUsers,
      hiddenTags,
      prioritizedTags
    } = updateDto;

    if (preferredContentTypes !== undefined) {
      preferences.preferredContentTypes = preferredContentTypes;
    }

    if (hiddenUsers !== undefined) {
      preferences.hiddenUsers = hiddenUsers;
    }

    if (prioritizedUsers !== undefined) {
      preferences.prioritizedUsers = prioritizedUsers;
    }

    if (hiddenTags !== undefined) {
      preferences.hiddenTags = hiddenTags;
    }

    if (prioritizedTags !== undefined) {
      preferences.prioritizedTags = prioritizedTags;
    }

    // Save updated preferences
    return this.feedPreferencesRepository.save(preferences);
  }

  // Calculate personalization weights based on user interaction history
  private async calculateContentWeights(userId: string, followingIds: string[]): Promise<{
    types: Record<string, number>;
    users: Record<string, number>;
  }> {
    // Default weights
    const typeWeights = {
      text: 1,
      image: 1,
      gallery: 1,
      video: 1,
      article: 1,
      portfolio: 1,
      project: 1,
      job: 1,
    };

    const userWeights = {};
    followingIds.forEach(id => userWeights[id] = 1);

    // Get user's recent reactions (last 30 days)
    const recentReactions = await this.reactionsRepository.find({
      where: {
        userId,
        createdAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
      relations: ['post'],
    });

    // Get user's recent comments (last 30 days)
    const recentComments = await this.commentsRepository.find({
      where: {
        userId,
        createdAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
      relations: ['post'],
    });

    // Process reactions to adjust weights
    for (const reaction of recentReactions) {
      if (reaction.post) {
        // Increase weight for this content type
        typeWeights[reaction.post.type] = (typeWeights[reaction.post.type] || 1) + 0.2;

        // Increase weight for this user's content
        userWeights[reaction.post.userId] = (userWeights[reaction.post.userId] || 1) + 0.3;
      }
    }

    // Process comments to adjust weights (comments indicate stronger engagement)
    for (const comment of recentComments) {
      if (comment.post) {
        // Increase weight for this content type
        typeWeights[comment.post.type] = (typeWeights[comment.post.type] || 1) + 0.5;

        // Increase weight for this user's content
        userWeights[comment.post.userId] = (userWeights[comment.post.userId] || 1) + 0.7;
      }
    }

    // Normalize weights
    const normalizeWeights = (weights: Record<string, number>) => {
      const values = Object.values(weights);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min || 1;

      const normalized = {};
      for (const [key, value] of Object.entries(weights)) {
        // Normalize to range [0.8, 2.0]
        normalized[key] = 0.8 + ((value - min) / range) * 1.2;
      }

      return normalized;
    };

    return {
      types: normalizeWeights(typeWeights),
      users: normalizeWeights(userWeights),
    };
  }
}