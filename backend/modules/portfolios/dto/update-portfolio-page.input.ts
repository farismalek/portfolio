import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, Length, IsBoolean, IsUUID } from 'class-validator';

@InputType()
export class UpdatePortfolioPageInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  content?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isHomePage?: boolean;
}