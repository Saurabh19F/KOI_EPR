import { ApiProperty } from '@nestjs/swagger';

export class TokenResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  expiresIn: number;
}

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ type: () => RoleInfoResponse })
  role: RoleInfoResponse | null;
}

export class RoleInfoResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ isArray: true })
  permissions: string[];
}

export class AuthResponse extends TokenResponse {
  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponse })
  user: UserResponse;
}
