export interface JwtPayload {
    id: string;
    username: string;
    roles: string[];
    iat?: number; // issued at time
    exp?: number; // expiration time
    iss?: string; // issuer
    aud?: string; // audience
    sub?: string; // subject
}