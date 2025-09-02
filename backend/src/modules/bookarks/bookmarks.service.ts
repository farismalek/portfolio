import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { PaginationInput } from '../../common/dto/pagination.input';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarksRepository: Repository<Bookmark>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Portfolio)
    private portfoliosRepository: Repository<Portfolio>,
  ) { }

  // Create a bookmark
  async create(createBookmarkDto: CreateBookmarkDto): Promise<Bookmark> {
    const { userId, postId, portfolioId } = createBookmarkDto;

    // Validate that only one of postId or portfolioId is provided
    if ((postId && portfolioId) || (!postId && !portfolioId)) {
      throw new BadRequestException('Provide either postId or portfolioId, not both or none');
    }

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if the item exists
    if (postId) {
      const post = await this.postsRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
    } else if (portfolioId) {
      const portfolio = await this.portfoliosRepository.findOne({ where: { id: portfolioId } });
      if (!portfolio) {
        throw new NotFoundException('Portfolio not found');
      }
    }

    // Check if bookmark already exists
    const existingBookmark = await this.bookmarksRepository.findOne({
      where: {
        userId,
        ...(postId ? { postId } : { portfolioId }),
      },
    });

    if (existingBookmark) {
      throw new ConflictException('Item is already bookmarked');
    }

    // Create bookmark
    const bookmark = this.bookmarksRepository.create({
      userId,
      postId,
      portfolioId,
    });

    return this.bookmarksRepository.save(bookmark);
  }

  // Get all bookmarks for a user
  async findUserBookmarks(userId: string, pagination?: PaginationInput): Promise<Bookmark[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.bookmarksRepository.find({
      where: { userId },
      relations: [
        'post', 'post.user', 'post.user.profiles',
        'portfolio', 'portfolio.user', 'portfolio.user.profiles'
      ],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  // Get post bookmarks for a user
  async findUserPostBookmarks(userId: string, pagination?: PaginationInput): Promise<Bookmark[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.bookmarksRepository.find({
      where: { userId, postId: Not(IsNull()) },
      relations: ['post', 'post.user', 'post.user.profiles'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  // Get portfolio bookmarks for a user
  async findUserPortfolioBookmarks(userId: string, pagination?: PaginationInput): Promise<Bookmark[]> {
    const { skip = 0, take = 20 } = pagination || {};

    return this.bookmarksRepository.find({
      where: { userId, portfolioId: Not(IsNull()) },
      relations: ['portfolio', 'portfolio.user', 'portfolio.user.profiles'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  // Check if item is bookmarked
  async checkIsBookmarked(userId: string, itemId: string): Promise<boolean> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: [
        { userId, postId: itemId },
        { userId, portfolioId: itemId }
      ],
    });

    return !!bookmark;
  }

  // Remove a bookmark
  async remove(id: string, userId: string): Promise<boolean> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: { id, userId }, // Ensure it belongs to this user
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarksRepository.remove(bookmark);
    return true;
  }

  // Remove bookmark by item
  async removeByItem(userId: string, itemId: string): Promise<boolean> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: [
        { userId, postId: itemId },
        { userId, portfolioId: itemId }
      ],
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarksRepository.remove(bookmark);
    return true;
  }
}