import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreatePortfolioPageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  title: string;

  @IsOptional()
  content?: Record<string, any>;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  isHomePage?: boolean;
}