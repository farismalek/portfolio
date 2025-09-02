import { InputType, Field, ID } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength, IsUUID } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  theme?: string;
}