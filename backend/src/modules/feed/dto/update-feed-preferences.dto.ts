import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsUUID, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateFeedPreferencesDto {
  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredContentTypes?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  hiddenUsers?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  prioritizedUsers?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  hiddenTags?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  prioritizedTags?: string[];
}