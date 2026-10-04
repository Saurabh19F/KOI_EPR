import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  userCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];

  @IsOptional()
  isActive?: boolean;
}
