import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { PortfolioStatus, PortfolioVisibility } from '../entities/portfolio.entity';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

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

  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}