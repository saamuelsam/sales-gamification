"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.connectRedis = void 0;
// backend/src/utils/redis.ts
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisClient = (0, redis_1.createClient)({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD || undefined,
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
redisClient.on('connect', () => console.log('✅ Redis conectado'));
const connectRedis = async () => {
    await redisClient.connect();
};
exports.connectRedis = connectRedis;
