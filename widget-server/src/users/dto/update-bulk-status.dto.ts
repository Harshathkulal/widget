import { IsArray, IsUUID, ArrayMinSize, IsString } from 'class-validator';

export class UpdateBulkStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsString()
  status!: string;
}
