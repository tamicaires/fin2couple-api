export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface JwtPayload {
  sub: string; // user.id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
