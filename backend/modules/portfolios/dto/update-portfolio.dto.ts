import { IsEnum, IsOptional, IsString, IsUUID, Length, IsBoolean } from 'class-validator';
import { PortfolioStatus, PortfolioVisibility } from '../entities/portfolio.entity';

export class UpdatePortfolioDto {
  @IsString()
  @IsOptional()
  @Length(3, 100)
  title?: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsEnum(PortfolioStatus)
  @IsOptional()
  status?: PortfolioStatus;

  @IsEnum(PortfolioVisibility)
  @IsOptional()
  visibility?: PortfolioVisibility;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUUID()
  @IsOptional()
  templateId?: string;

  @IsOptional()
  customizations?: Record<string, any>;

  @IsOptional()
  settings?: Record<string, any>;

  @IsOptional()
  analytics?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsOptional()
  publishedAt?: Date;

  @IsOptional()
  lastViewedAt?: Date;
}