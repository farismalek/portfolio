import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

@InputType()
export class CreateNotificationDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field(() => String)
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  senderId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  postId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  commentId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  portfolioId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  message?: string;
}