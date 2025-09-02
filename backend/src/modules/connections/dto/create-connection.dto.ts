import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { ConnectionType } from '../entities/connection.entity';

@InputType()
export class CreateConnectionDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  followerId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  followingId: string;

  @Field(() => String)
  @IsEnum(ConnectionType)
  @IsNotEmpty()
  type: ConnectionType;
}