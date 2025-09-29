import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000'),
  jwtSecret: process.env.JWT_SECRET || 'secretKey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3600s',
}));
