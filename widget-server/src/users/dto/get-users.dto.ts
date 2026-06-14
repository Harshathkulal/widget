import {
  IsOptional,
  IsString,
  IsNumberString,
  IsIn,
  Length,
} from 'class-validator';

export class GetUsersDto {
  @IsOptional()
  @IsString()
  @Length(0, 120)
  search?: string;

  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @IsOptional()
  @IsNumberString()
  limit?: string = '10';

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'email', 'status', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC';
}
