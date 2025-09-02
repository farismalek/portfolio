import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

@InputType()
export class CreateCommentDto {
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
  content: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}