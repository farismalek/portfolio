import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { PortfolioStatus, PortfolioVisibility } from '../entities/portfolio.entity';

@InputType()
export class CreatePortfolioInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

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

  @Field()
  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}