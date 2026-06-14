import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  appName!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedDomains?: string[];

  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
