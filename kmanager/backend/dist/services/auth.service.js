"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = exports.InvalidCredentialsError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_repository_1 = require("@repositories/user.repository");
const user_model_1 = require("@models/user.model");
const jwt_util_1 = require("@utils/jwt.util");
class InvalidCredentialsError extends Error {
    constructor() {
        super('Usuario o contraseña incorrectos');
        this.name = 'InvalidCredentialsError';
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class AuthService {
    async login(username, password) {
        const user = await user_repository_1.userRepository.findByUsername(username);
        if (!user) {
            throw new InvalidCredentialsError();
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }
        const payload = { sub: user.id, username: user.username, role: user.role };
        return {
            user: (0, user_model_1.toSafeUser)(user),
            accessToken: (0, jwt_util_1.signAccessToken)(payload),
            refreshToken: (0, jwt_util_1.signRefreshToken)(payload),
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map