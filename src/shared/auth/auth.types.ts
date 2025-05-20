export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export enum UserRole {
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse extends AuthResponse {} 