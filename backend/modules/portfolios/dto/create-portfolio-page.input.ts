import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class CreatePortfolioPageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  content?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  @IsOptional()
  isHomePage?: boolean;
}