import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateBookmarkDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  postId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  portfolioId?: string;
}