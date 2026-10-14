export class CurrentUserDto {
  userId: string;
  email: string;
  companyId?: string;
  isSuperAdmin: boolean;
  roleIds?: string[];
  permissions?: string[];
}
