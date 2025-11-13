"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || 'Sales Gamification',
};
