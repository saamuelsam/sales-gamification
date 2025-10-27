// src/config/jwt.ts
import jwt, { SignOptions, JwtPayload as JWTLibPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string; // força string
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export interface AppJwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Geração do token com opções tipadas
export const generateToken = (payload: AppJwtPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verificação e cast para o payload da aplicação
export const verifyToken = (token: string): AppJwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as JWTLibPayload | string;
  if (typeof decoded === 'string') {
    // Caso improvável (quando o token foi assinado com string pura)
    return JSON.parse(decoded) as AppJwtPayload;
  }
  // decoded contém iat/exp além do payload
  const { userId, email, role } = decoded as unknown as AppJwtPayload;
  return { userId, email, role };
};
