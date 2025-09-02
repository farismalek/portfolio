import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateReactionDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  type: string;
}