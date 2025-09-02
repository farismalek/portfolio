import { InputType, Field, ID } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID, Length, IsBoolean } from 'class-validator';
import { PortfolioStatus, PortfolioVisibility } from '../entities/portfolio.entity';

@InputType()
export class UpdatePortfolioInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(3, 100)
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(PortfolioStatus)
  @IsOptional()
  status?: PortfolioStatus;

  @Field(() => String, { nullable: true })
  @IsEnum(PortfolioVisibility)
  @IsOptional()
  visibility?: PortfolioVisibility;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  password?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  slug?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  customDomain?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  customizations?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @IsOptional()
  settings?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @IsOptional()
  analytics?: Record<string, any>;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}