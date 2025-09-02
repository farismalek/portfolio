import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { GroupType, GroupVisibility } from '../entities/group.entity';

@InputType()
export class SearchGroupsDto {
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
  searchTerm?: string;
}