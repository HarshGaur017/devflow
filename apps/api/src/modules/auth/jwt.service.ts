import jwt from 'jsonwebtoken';

export interface JwtPayload {
    userId: string;
}

export function generateAccessToken(payload: JwtPayload) {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );
}

export function verifyAccessToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
}