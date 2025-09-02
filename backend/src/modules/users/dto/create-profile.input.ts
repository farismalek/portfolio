import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

@InputType()
export class CreateProfileInput {
  @Field()
  @IsString()
  @MaxLength(100)
  title: string;

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

  @Field({ nullable: true, defaultValue: 'cosmic' })
  @IsString()
  @IsOptional()
  theme?: string;
}