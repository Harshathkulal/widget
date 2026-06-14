import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

import { UserRole } from '../entities/auth.entity';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
