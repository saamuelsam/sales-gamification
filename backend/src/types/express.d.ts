import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
      [key: string]: any;
    };
  }
}
