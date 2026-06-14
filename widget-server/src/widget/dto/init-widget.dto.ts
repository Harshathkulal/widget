import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsInt,
  Length,
  Min,
} from 'class-validator';

export class InitWidgetDto {
  @IsUUID()
  @IsNotEmpty()
  appId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(16, 256)
  signature!: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  timestamp!: number;

  @IsString()
  @IsNotEmpty()
  @Length(16, 128)
  nonce!: string;
}
