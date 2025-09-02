import { Resolver, Query, Context, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { GqlAuthGuard } from './guards/gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) { }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context) {
    const userId = context.req.user.id;
    return this.authService.getUserProfile(userId);
  }
}