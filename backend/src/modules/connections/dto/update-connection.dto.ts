import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ConnectionStatus } from '../entities/connection.entity';

@InputType()
export class UpdateConnectionDto {
  @Field(() => String)
  @IsEnum(ConnectionStatus)
  @IsNotEmpty()
  status: ConnectionStatus;
}