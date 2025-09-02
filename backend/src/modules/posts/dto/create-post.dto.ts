import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { PostType, PostVisibility } from '../entities/post.entity';

@InputType()
export class CreatePostDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  content?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;

  @Field(() => String, { nullable: true })
  @IsObject()
  @IsOptional()
  media?: Record<string, any>;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  portfolioId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility = PostVisibility.PUBLIC;
}