import { IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class RemoveBulkUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids!: string[];
}
