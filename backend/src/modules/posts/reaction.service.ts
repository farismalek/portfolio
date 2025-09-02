import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction } from './entities/reaction.entity';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private reactionsRepository: Repository<Reaction>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) { }

  // Create or update a reaction on a post
  async createOrUpdate(createReactionDto: CreateReactionDto): Promise<Reaction> {
    const { userId, postId, type } = createReactionDto;

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

    // Check if reaction already exists
    const existingReaction = await this.reactionsRepository.findOne({
      where: {
        userId,
        postId,
        type,
      },
    });

    // If reaction already exists, remove it (toggle behavior)
    if (existingReaction) {
      await this.reactionsRepository.remove(existingReaction);
      return null; // Return null to indicate removal
    }

    // Delete any other reactions from the same user on this post (e.g. change from like to love)
    await this.reactionsRepository.delete({
      userId,
      postId,
    });

    // Create new reaction
    const reaction = this.reactionsRepository.create({
      userId,
      postId,
      type,
    });

    const savedReaction = await this.reactionsRepository.save(reaction);

    // Notify post author (if not self-reaction)
    if (post.userId !== userId) {
      await this.notificationsService.create({
        userId: post.userId,
        type: NotificationType.POST_LIKE,
        senderId: userId,
        postId,
      });
    }

    return savedReaction;
  }

  // Get all reactions for a post
  async findByPostId(postId: string): Promise<Reaction[]> {
    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.reactionsRepository.find({
      where: { postId },
      relations: ['user', 'user.profiles'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get reaction counts by type for a post
  async getReactionCountsByType(postId: string): Promise<Record<string, number>> {
    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reactions = await this.reactionsRepository.find({
      where: { postId },
      select: ['type'],
    });

    const counts = {};

    reactions.forEach(reaction => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1;
    });

    return counts;
  }

  // Remove a reaction
  async remove(id: string, currentUserId: string): Promise<boolean> {
    const reaction = await this.reactionsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    // Only allow the reaction owner to delete it
    if (reaction.userId !== currentUserId) {
      throw new BadRequestException('Not authorized to delete this reaction');
    }

    await this.reactionsRepository.remove(reaction);

    return true;
  }
}