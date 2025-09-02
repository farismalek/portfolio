import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { GroupType, GroupVisibility } from '../entities/group.entity';

@InputType()
export class UpdateGroupDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(GroupType)
  @IsOptional()
  type?: GroupType;

  @Field(() => String, { nullable: true })
  @IsEnum(GroupVisibility)
  @IsOptional()
  visibility?: GroupVisibility;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  coverUrl?: string;
}