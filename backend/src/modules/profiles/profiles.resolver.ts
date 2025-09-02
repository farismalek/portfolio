import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';
import { CreateProfileInput } from './dto/create-profile.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Resolver(() => Profile)
export class ProfilesResolver {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
  ) { }

  @Mutation(() => Profile)
  @UseGuards(GqlAuthGuard)
  createProfile(
    @Args('createProfileInput') createProfileInput: CreateProfileInput,
    @CurrentUser() user: User,
  ) {
    return this.profilesService.create(createProfileInput, user);
  }

  @Query(() => [Profile], { name: 'profiles' })
  @UseGuards(GqlAuthGuard)
  findAll(@CurrentUser() user: User) {
    // Regular users can only view their own profiles
    if (user.role !== 'admin') {
      return this.profilesService.findAllByUser(user.id);
    }
    // Admins can view all profiles
    return this.profilesService.findAll();
  }

  @Query(() => Profile, { name: 'profile' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.profilesService.findOne(id);
  }

  @Query(() => Profile, { name: 'defaultProfile' })
  @UseGuards(GqlAuthGuard)
  findDefault(@CurrentUser() user: User) {
    return this.profilesService.findDefault(user.id);
  }

  @Mutation(() => Profile)
  @UseGuards(GqlAuthGuard)
  updateProfile(
    @Args('updateProfileInput') updateProfileInput: UpdateProfileInput,
    @CurrentUser() user: User,
  ) {
    return this.profilesService.update(updateProfileInput.id, updateProfileInput);
  }

  @Mutation(() => Profile)
  @UseGuards(GqlAuthGuard)
  setDefaultProfile(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.profilesService.setAsDefault(id, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async removeProfile(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    const profile = await this.profilesService.findOne(id);

    // Check if the profile belongs to the current user or user is admin
    if (profile.userId !== user.id && user.role !== 'admin') {
      throw new Error('You can only delete your own profiles');
    }

    await this.profilesService.remove(id);
    return true;
  }

  @ResolveField(() => User)
  async user(@Parent() profile: Profile) {
    return this.usersService.findOneById(profile.userId);
  }
}