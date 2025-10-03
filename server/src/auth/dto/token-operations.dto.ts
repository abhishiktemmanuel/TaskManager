// src/auth/dto/token-operations.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GenerateTokenDto {
  @IsOptional()
  @IsNumber()
  teamId?: number;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class RevokeTokenDto {
  @IsString()
  token: string;
}
