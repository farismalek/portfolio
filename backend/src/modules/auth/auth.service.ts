import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(auth0Id: string): Promise<User | null> {
    const user = await this.usersService.findOneByAuth0Id(auth0Id);
    if (user) {
      return user;
    }
    return null;
  }

  async getUserProfile(userId: string): Promise<User> {
    return this.usersService.findOneById(userId);
  }
}