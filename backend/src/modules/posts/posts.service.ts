import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post, PostStatus, PostType } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Hashtag } from './entities/hashtag.entity';
import { PostHashtag } from './entities/post-hashtag.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { ConnectionsService } from '../connections/connections.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(Hashtag)
    private hashtagsRepository: Repository<Hashtag>,
    @InjectRepository(PostHashtag)
    private postHashtagsRepository: Repository<PostHashtag>,
    private connectionsService: ConnectionsService,
    private notificationsService: NotificationsService,
  ) { }

  // Create a new post
  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { userId, content, title, type, media, portfolioId, parentId, visibility } = createPostDto;

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If this is a reply, check if parent post exists
    if (parentId) {
      const parentPost = await this.postsRepository.findOne({ where: { id: parentId } });
      if (!parentPost) {
        throw new NotFoundException('Parent post not found');
      }

      // A reply should not have its own replies
      if (parentPost.parentId) {
        throw new BadRequestException('Cannot reply to a reply');
      }
    }

    // Create the post
    const post = this.postsRepository.create({
      userId,
      title,
      content,
      type: type || PostType.TEXT,
      media,
      portfolioId,
      parentId,
      visibility,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    const savedPost = await this.postsRepository.save(post);

    // Extract and save hashtags from content
    if (content) {
      await this.processHashtags(savedPost.id, content);
    }

    // Process mentions and send notifications
    if (content) {
      await this.processMentions(savedPost.id, content, userId);
    }

    // Update user's post count
    await this.updateUserPostCount(userId);

    // If this is a reply, notify the parent post author
    if (parentId) {
      const parentPost = await this.postsRepository.findOne({ where: { id: parentId } });
      if (parentPost && parentPost.userId !== userId) {
        await this.notificationsService.create({
          userId: parentPost.userId,
          type: NotificationType.POST_COMMENT,
          senderId: userId,
          postId: parentId,
          commentId: savedPost.id,
        });
      }
    }

    return savedPost;
  }

  // Get a single post by id
  async findOne(id: string, currentUserId?: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'user.profiles', 'reactions', 'comments'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if the post visibility allows the current user to see it
    if (post.visibility !== 'public' && currentUserId !== post.userId) {
      if (post.visibility === 'private') {
        throw new NotFoundException('Post not found');
      }

      if (post.visibility === 'connections') {
        const followStatus = await this.connectionsService.checkFollowStatus(post.userId, currentUserId);
        if (!followStatus.isFollowing) {
          throw new NotFoundException('Post not found');
        }
      }
    }

    // Calculate virtual fields
    post.reactionCount = post.reactions?.length || 0;
    post.commentCount = post.comments?.length || 0;

    // Determine if the current user has reacted to this post
    post.hasUserReacted = false;
    if (currentUserId && post.reactions) {
      post.hasUserReacted = post.reactions.some(reaction => reaction.userId === currentUserId);
    }

    // Increment view count if it's not the author viewing
    if (currentUserId !== post.userId) {
      post.viewCount += 1;
      await this.postsRepository.update(id, { viewCount: post.viewCount });
    }

    return post;
  }

  // Get all posts with flexible filtering options
  async findAll(params: {
    userId?: string;
    type?: PostType;
    status?: PostStatus;
    visibility?: string;
    portfolioId?: string;
    hashtag?: string;
    currentUserId?: string;
    pagination?: PaginationInput;
  }): Promise<Post[]> {
    const {
      userId,
      type,
      status,
      visibility,
      portfolioId,
      hashtag,
      currentUserId,
      pagination
    } = params;

    const { skip = 0, take = 20 } = pagination || {};

    // Start building the query
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile', 'profile.isDefault = :isDefault', { isDefault: true })
      .leftJoinAndSelect('post.reactions', 'reactions')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .loadRelationCountAndMap('post.shareCount', 'post.shares')
      .where('post.parentId IS NULL') // Only fetch top-level posts, not replies
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('post.userId = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('post.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    } else {
      queryBuilder.andWhere('post.status = :status', { status: PostStatus.PUBLISHED });
    }

    if (visibility) {
      queryBuilder.andWhere('post.visibility = :visibility', { visibility });
    }

    if (portfolioId) {
      queryBuilder.andWhere('post.portfolioId = :portfolioId', { portfolioId });
    }

    // Filter by hashtag if provided
    if (hashtag) {
      queryBuilder.innerJoin('post.postHashtags', 'postHashtags')
        .innerJoin('postHashtags.hashtag', 'hashtag')
        .andWhere('hashtag.name = :hashtagName', { hashtagName: hashtag });
    }

    // Handle visibility for the current user
    if (currentUserId && currentUserId !== userId) {
      // If looking at specific user's posts, filter by visibility
      queryBuilder.andWhere(`
        (
          post.visibility = 'public' OR 
          (post.visibility = 'connections' AND EXISTS(
            SELECT 1 FROM connections 
            WHERE 
              (
                (connections.followerId = post.userId AND connections.followingId = :currentUserId) OR
                (connections.followerId = :currentUserId AND connections.followingId = post.userId)
              ) AND
              connections.status = 'accepted'
          )) OR
          (post.userId = :currentUserId)
        )
      `, { currentUserId });
    }

    const posts = await queryBuilder.getMany();

    // Calculate if current user has reacted to each post
    if (currentUserId) {
      posts.forEach(post => {
        post.hasUserReacted = post.reactions?.some(reaction => reaction.userId === currentUserId) || false;
      });
    }

    return posts;
  }

  // Update a post
  async update(id: string, updatePostDto: UpdatePostDto, currentUserId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only allow the author to update the post
    if (post.userId !== currentUserId) {
      throw new BadRequestException('Not authorized to update this post');
    }

    const { title, content, media, status, visibility } = updatePostDto;

    // Update the post
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (media !== undefined) post.media = media;
    if (status !== undefined) post.status = status;
    if (visibility !== undefined) post.visibility = visibility;

    // If publishing for the first time, set publishedAt
    if (status === PostStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    post.updatedAt = new Date();

    const updatedPost = await this.postsRepository.save(post);

    // Update hashtags if content changed
    if (content !== undefined) {
      // Remove existing hashtags
      await this.postHashtagsRepository.delete({ postId: id });

      // Process and add new hashtags
      await this.processHashtags(id, content);
    }

    return updatedPost;
  }

  // Delete a post
  async remove(id: string, currentUserId: string): Promise<boolean> {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only allow the author to delete the post
    if (post.userId !== currentUserId) {
      throw new BadRequestException('Not authorized to delete this post');
    }

    await this.postsRepository.remove(post);

    // Update user's post count
    await this.updateUserPostCount(post.userId);

    return true;
  }

  // Get comments/replies for a post
  async getComments(postId: string, pagination?: PaginationInput): Promise<Post[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.postsRepository.find({
      where: { parentId: postId },
      relations: ['user', 'user.profiles', 'reactions'],
      skip,
      take,
      order: { createdAt: 'ASC' },
    });
  }

  // Get trending posts
  async getTrendingPosts(pagination?: PaginationInput): Promise<Post[]> {
    const { skip = 0, take = 20 } = pagination || {};

    // Score posts based on views, reactions, comments, and recency
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile', 'profile.isDefault = :isDefault', { isDefault: true })
      .leftJoinAndSelect('post.reactions', 'reactions')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .loadRelationCountAndMap('post.shareCount', 'post.shares')
      .where('post.parentId IS NULL') // Only top-level posts
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.visibility = :visibility', { visibility: 'public' })
      .andWhere('post.createdAt > :minDate', { minDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }) // Last 7 days
      .orderBy(`(
        post.viewCount * 1 + 
        (SELECT COUNT(*) FROM reactions WHERE reactions.postId = post.id) * 5 + 
        (SELECT COUNT(*) FROM posts comments WHERE comments.parentId = post.id) * 10
      ) / (EXTRACT(EPOCH FROM (NOW() - post.createdAt)) / 3600)`, 'DESC') // Score formula with time decay
      .skip(skip)
      .take(take);

    return queryBuilder.getMany();
  }

  // Process hashtags from post content
  private async processHashtags(postId: string, content: string): Promise<void> {
    // Extract hashtags from content using regex
    const hashtagRegex = /#(\w+)/g;
    const matches = content.matchAll(hashtagRegex);
    const hashtagNames = [...new Set([...matches].map(match => match[1].toLowerCase()))];

    // If no hashtags found, return
    if (hashtagNames.length === 0) {
      return;
    }

    // For each hashtag
    for (const name of hashtagNames) {
      // Find or create the hashtag
      let hashtag = await this.hashtagsRepository.findOne({
        where: { name },
      });

      if (!hashtag) {
        hashtag = this.hashtagsRepository.create({ name });
      }

      // Increment the post count
      hashtag.postCount = (hashtag.postCount || 0) + 1;

      // Save the hashtag
      const savedHashtag = await this.hashtagsRepository.save(hashtag);

      // Create post-hashtag association
      const postHashtag = this.postHashtagsRepository.create({
        postId,
        hashtagId: savedHashtag.id,
      });

      await this.postHashtagsRepository.save(postHashtag);
    }
  }

  // Process mentions from post content and send notifications
  private async processMentions(postId: string, content: string, authorId: string): Promise<void> {
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
        postId,
      });
    }
  }

  // Update user's post count
  private async updateUserPostCount(userId: string): Promise<void> {
    // Count user's posts
    const postCount = await this.postsRepository.count({
      where: {
        userId,
        status: PostStatus.PUBLISHED,
        parentId: null, // Only count top-level posts, not replies
      },
    });

    // Update profile stats
    const profile = await this.profilesRepository.findOne({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (profile) {
      profile.postCount = postCount;
      await this.profilesRepository.save(profile);
    }
  }
}