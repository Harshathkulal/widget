import { IsUUID, IsString, IsNotEmpty, Length } from 'class-validator';

export class InitWidgetDto {
  @IsUUID()
  @IsNotEmpty()
  appId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  clientId!: string;
}
