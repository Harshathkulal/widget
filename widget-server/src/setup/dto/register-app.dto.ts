import { IsString, IsNotEmpty, IsEmail, IsArray } from 'class-validator';

export class RegisterAppDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  appName!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  allowedDomains!: string[];
}
