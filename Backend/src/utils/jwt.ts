import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (payload: TokenPayload): TokenPair => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: '15m', // Short-lived access token
    issuer: 'blog-api',
    audience: 'blog-client'
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId }, // Only include userId in refresh token
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d', // Long-lived refresh token
      issuer: 'blog-api',
      audience: 'blog-client'
    }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: 'blog-api',
    audience: 'blog-client'
  }) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'blog-api',
    audience: 'blog-client'
  }) as { userId: string };
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
