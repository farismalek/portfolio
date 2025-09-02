import { IsOptional, IsString, Length, IsBoolean } from 'class-validator';

export class UpdatePortfolioPageDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  content?: Record<string, any>;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isHomePage?: boolean;
}