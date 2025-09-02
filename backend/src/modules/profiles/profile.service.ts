import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) { }

  async create(createProfileDto: CreateProfileDto, user: User): Promise<Profile> {
    // Check if this is the first profile for the user (make it default if so)
    const existingProfiles = await this.profilesRepository.find({
      where: { userId: user.id },
    });

    const isDefault = existingProfiles.length === 0;

    const profile = this.profilesRepository.create({
      ...createProfileDto,
      userId: user.id,
      user,
      isDefault,
    });

    return this.profilesRepository.save(profile);
  }

  async findAll(): Promise<Profile[]> {
    return this.profilesRepository.find();
  }

  async findAllByUser(userId: string): Promise<Profile[]> {
    return this.profilesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    return profile;
  }

  async findDefault(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { userId, isDefault: true },
    });

    if (!profile) {
      throw new NotFoundException(`Default profile for user ${userId} not found`);
    }

    return profile;
  }

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id);

    // Update the profile properties
    Object.assign(profile, updateProfileDto);

    return this.profilesRepository.save(profile);
  }

  async setAsDefault(id: string, userId: string): Promise<Profile> {
    // First, unset default on all profiles for this user
    await this.profilesRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Then set this profile as default
    const profile = await this.findOne(id);
    profile.isDefault = true;

    return this.profilesRepository.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);

    // Check if this is the default profile
    if (profile.isDefault) {
      // Find another profile to set as default
      const anotherProfile = await this.profilesRepository.findOne({
        where: { userId: profile.userId, id: id !== id },
      });

      if (anotherProfile) {
        anotherProfile.isDefault = true;
        await this.profilesRepository.save(anotherProfile);
      }
    }

    await this.profilesRepository.remove(profile);
  }
}