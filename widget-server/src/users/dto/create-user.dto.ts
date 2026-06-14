import { IsEmail, IsString, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsIn(['ACTIVE', 'INACTIVE'])
  status!: string;
}
