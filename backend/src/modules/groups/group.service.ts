import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupVisibility } from './entities/group.entity';
import { GroupMembership, MembershipRole, MembershipStatus } from './entities/group-membership.entity';
import { GroupPost } from './entities/group-post.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { SearchGroupsDto } from './dto/search-groups.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(GroupMembership)
    private membershipsRepository: Repository<GroupMembership>,
    @InjectRepository(GroupPost)
    private groupPostsRepository: Repository<GroupPost>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private notificationsService: NotificationsService,
  ) { }

  // Create a new group
  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const { name, description, type, visibility, creatorId, avatarUrl, coverUrl } = createGroupDto;

    // Check if user exists
    const creator = await this.usersRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existingGroup = await this.groupsRepository.findOne({
      where: { slug },
    });

    if (existingGroup) {
      throw new ConflictException('A group with this name already exists');
    }

    // Create group
    const group = this.groupsRepository.create({
      name,
      description,
      type,
      visibility,
      slug,
      avatarUrl,
      coverUrl,
      creatorId,
      memberCount: 1, // Creator is the first member
    });

    const savedGroup = await this.groupsRepository.save(group);

    // Add creator as admin member
    const membership = this.membershipsRepository.create({
      userId: creatorId,
      groupId: savedGroup.id,
      role: MembershipRole.ADMIN,
      status: MembershipStatus.ACTIVE,
    });

    await this.membershipsRepository.save(membership);

    return savedGroup;
  }

  // Get a group by ID
  async findOne(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  // Get a group by slug
  async findBySlug(slug: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { slug },
      relations: ['creator'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  // Get all groups with filtering
  async findAll(searchDto: SearchGroupsDto, pagination?: PaginationInput): Promise<Group[]> {
    const { skip = 0, take = 20 } = pagination || {};
    const { type, visibility, searchTerm } = searchDto || {};

    const queryBuilder = this.groupsRepository.createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .skip(skip)
      .take(take);

    if (type) {
      queryBuilder.andWhere('group.type = :type', { type });
    }

    if (visibility) {
      queryBuilder.andWhere('group.visibility = :visibility', { visibility });
    }

    // Only show public and private groups in search (not secret)
    queryBuilder.andWhere('group.visibility != :secretVisibility', {
      secretVisibility: GroupVisibility.SECRET
    });

    if (searchTerm) {
      queryBuilder.andWhere('(group.name ILIKE :searchTerm OR group.description ILIKE :searchTerm)', {
        searchTerm: `%${searchTerm}%`,
      });
    }

    return queryBuilder.orderBy('group.memberCount', 'DESC').getMany();
  }

  // Get groups for a user
  async findUserGroups(userId: string, pagination?: PaginationInput): Promise<Group[]> {
    const { skip = 0, take = 20 } = pagination || {};

    // Find all active memberships for user
    const memberships = await this.membershipsRepository.find({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['group', 'group.creator'],
      skip,
      take,
    });

    return memberships.map(membership => membership.group);
  }

  // Update a group
  async update(id: string, updateGroupDto: UpdateGroupDto, currentUserId: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user has permission to update (admin or creator)
    const membership = await this.membershipsRepository.findOne({
      where: {
        userId: currentUserId,
        groupId: id,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership || (membership.role !== MembershipRole.ADMIN && group.creatorId !== currentUserId)) {
      throw new BadRequestException('You do not have permission to update this group');
    }

    // Update fields
    const { name, description, type, visibility, avatarUrl, coverUrl } = updateGroupDto;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (type) group.type = type;

    // Only creator can change visibility
    if (visibility && group.creatorId === currentUserId) {
      group.visibility = visibility;
    }

    if (avatarUrl !== undefined) group.avatarUrl = avatarUrl;
    if (coverUrl !== undefined) group.coverUrl = coverUrl;

    // If name changed, update slug
    if (name && name !== group.name) {
      const newSlug = this.generateSlug(name);

      // Check if new slug already exists
      const existingGroup = await this.groupsRepository.findOne({
        where: { slug: newSlug },
      });

      if (existingGroup && existingGroup.id !== id) {
        throw new ConflictException('A group with this name already exists');
      }

      group.slug = newSlug;
    }

    return this.groupsRepository.save(group);
  }

  // Delete a group
  async remove(id: string, currentUserId: string): Promise<boolean> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only creator can delete group
    if (group.creatorId !== currentUserId) {
      throw new BadRequestException('Only the group creator can delete the group');
    }

    await this.groupsRepository.remove(group);
    return true;
  }

  // Join or request to join a group
  async joinGroup(createMembershipDto: CreateMembershipDto): Promise<GroupMembership> {
    const { userId, groupId } = createMembershipDto;

    // Check if group exists
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if membership already exists
    const existingMembership = await this.membershipsRepository.findOne({
      where: {
        userId,
        groupId,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === MembershipStatus.ACTIVE) {
        throw new ConflictException('User is already a member of this group');
      }

      if (existingMembership.status === MembershipStatus.PENDING) {
        throw new ConflictException('Membership request is already pending');
      }

      if (existingMembership.status === MembershipStatus.BANNED) {
        throw new BadRequestException('User is banned from this group');
      }
    }

    // For public groups, directly add as active member
    // For private groups, create pending membership
    const status = group.visibility === GroupVisibility.PUBLIC ?
      MembershipStatus.ACTIVE : MembershipStatus.PENDING;

    const membership = this.membershipsRepository.create({
      userId,
      groupId,
      role: MembershipRole.MEMBER,
      status,
    });

    const savedMembership = await this.membershipsRepository.save(membership);

    // Update member count if active
    if (status === MembershipStatus.ACTIVE) {
      await this.updateMemberCount(groupId);
    } else if (status === MembershipStatus.PENDING) {
      // Notify group admins about pending request
      const adminMemberships = await this.membershipsRepository.find({
        where: {
          groupId,
          role: MembershipRole.ADMIN,
          status: MembershipStatus.ACTIVE,
        },
      });

      // TODO: Create notifications for admins about the join request
    }

    return savedMembership;
  }

  // Update membership status
  async updateMembership(id: string, updateDto: UpdateMembershipDto, currentUserId: string): Promise<GroupMembership> {
    const { status, role } = updateDto;

    // Find membership
    const membership = await this.membershipsRepository.findOne({
      where: { id },
      relations: ['group'],
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if current user has permission (must be admin or creator)
    const currentUserMembership = await this.membershipsRepository.findOne({
      where: {
        userId: currentUserId,
        groupId: membership.groupId,
        status: MembershipStatus.ACTIVE,
      },
    });

    const isCreator = membership.group.creatorId === currentUserId;
    const isAdmin = currentUserMembership && currentUserMembership.role === MembershipRole.ADMIN;

    if (!isCreator && !isAdmin) {
      throw new BadRequestException('You do not have permission to update memberships');
    }

    // Only creator can modify admin roles
    if (role && role === MembershipRole.ADMIN && !isCreator) {
      throw new BadRequestException('Only the group creator can assign admin roles');
    }

    // Apply updates
    if (status) membership.status = status;
    if (role) membership.role = role;

    const updatedMembership = await this.membershipsRepository.save(membership);

    // Update member count if status changed to/from active
    if (status === MembershipStatus.ACTIVE || membership.status === MembershipStatus.ACTIVE) {
      await this.updateMemberCount(membership.groupId);
    }

    return updatedMembership;
  }

  // Leave a group
  async leaveGroup(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.membershipsRepository.findOne({
      where: {
        userId,
        groupId,
      },
      relations: ['group'],
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    // Cannot leave if you're the creator
    if (membership.group.creatorId === userId) {
      throw new BadRequestException('The group creator cannot leave the group');
    }

    // Remove membership
    await this.membershipsRepository.remove(membership);

    // Update member count
    if (membership.status === MembershipStatus.ACTIVE) {
      await this.updateMemberCount(groupId);
    }

    return true;
  }

  // Get members of a group
  async getMembers(groupId: string, pagination?: PaginationInput): Promise<GroupMembership[]> {
    const { skip = 0, take = 20 } = pagination || {};

    // Check if group exists
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.membershipsRepository.find({
      where: {
        groupId,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user', 'user.profiles'],
      skip,
      take,
      order: {
        role: 'ASC', // Admins first
        createdAt: 'ASC',
      },
    });
  }

  // Add post to group
  async addPostToGroup(postId: string, groupId: string, userId: string): Promise<GroupPost> {
    // Check if group exists
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is post author
    if (post.userId !== userId) {
      throw new BadRequestException('You can only add your own posts to groups');
    }

    // Check if user is a member of the group
    const membership = await this.membershipsRepository.findOne({
      where: {
        userId,
        groupId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new BadRequestException('You must be a member to post in this group');
    }

    // Check if post already exists in group
    const existingGroupPost = await this.groupPostsRepository.findOne({
      where: {
        postId,
        groupId,
      },
    });

    if (existingGroupPost) {
      throw new ConflictException('This post is already in the group');
    }

    // Create group post association
    const groupPost = this.groupPostsRepository.create({
      postId,
      groupId,
    });

    const savedGroupPost = await this.groupPostsRepository.save(groupPost);

    // Update post count
    group.postCount += 1;
    await this.groupsRepository.save(group);

    return savedGroupPost;
  }

  // Remove post from group
  async removePostFromGroup(postId: string, groupId: string, userId: string): Promise<boolean> {
    const groupPost = await this.groupPostsRepository.findOne({
      where: {
        postId,
        groupId,
      },
      relations: ['post', 'group'],
    });

    if (!groupPost) {
      throw new NotFoundException('Post not found in group');
    }

    // Check if user has permission (post author, group admin, or group creator)
    const isPostAuthor = groupPost.post.userId === userId;
    const isGroupCreator = groupPost.group.creatorId === userId;

    const membership = await this.membershipsRepository.findOne({
      where: {
        userId,
        groupId,
        role: MembershipRole.ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    const isAdmin = !!membership;

    if (!isPostAuthor && !isAdmin && !isGroupCreator) {
      throw new BadRequestException('You do not have permission to remove this post');
    }

    // Remove post from group
    await this.groupPostsRepository.remove(groupPost);

    // Update post count
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (group) {
      group.postCount = Math.max(0, group.postCount - 1);
      await this.groupsRepository.save(group);
    }

    return true;
  }

  // Get posts from a group
  async getGroupPosts(groupId: string, pagination?: PaginationInput): Promise<Post[]> {
    const { skip = 0, take = 20 } = pagination || {};

    // Check if group exists
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Get group posts with post data
    const groupPosts = await this.groupPostsRepository.find({
      where: { groupId },
      relations: ['post', 'post.user', 'post.user.profiles', 'post.reactions'],
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });

    return groupPosts.map(gp => gp.post);
  }

  // Private helper to generate a slug from a name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
      .substring(0, 60); // Limit length
  }

  // Private helper to update member count
  private async updateMemberCount(groupId: string): Promise<void> {
    const count = await this.membershipsRepository.count({
      where: {
        groupId,
        status: MembershipStatus.ACTIVE,
      },
    });

    await this.groupsRepository.update(groupId, { memberCount: count });
  }
}