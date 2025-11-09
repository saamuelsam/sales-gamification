"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }
    static error(res, message, statusCode = 400, errors) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }
    static created(res, data, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }
}
exports.ApiResponse = ApiResponse;
