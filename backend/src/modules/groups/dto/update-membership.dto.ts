import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { MembershipRole, MembershipStatus } from '../entities/group-membership.entity';

@InputType()
export class UpdateMembershipDto {
  @Field(() => String, { nullable: true })
  @IsEnum(MembershipStatus)
  @IsOptional()
  status?: MembershipStatus;

  @Field(() => String, { nullable: true })
  @IsEnum(MembershipRole)
  @IsOptional()
  role?: MembershipRole;
}