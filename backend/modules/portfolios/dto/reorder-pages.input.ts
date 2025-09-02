import { InputType, Field, ID } from '@nestjs/graphql';
import { ArrayNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class ReorderPagesInput {
  @Field(() => ID)
  @IsUUID()
  portfolioId: string;

  @Field(() => [ID])
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  pageIds: string[];
}