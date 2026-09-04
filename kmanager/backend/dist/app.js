"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("@config/env");
const auth_routes_1 = __importDefault(require("@routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("@routes/dashboard.routes"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: true, credentials: true }));
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)(env_1.env.nodeEnv === 'development' ? 'dev' : 'combined'));
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/dashboard', dashboard_routes_1.default);
    app.use('/api', dashboard_routes_1.default);
    // 404
    app.use((_req, res) => {
        res.status(404).json({ message: 'Recurso no encontrado' });
    });
    // Manejador de errores centralizado
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error('[Unhandled Error]', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    });
    return app;
}
//# sourceMappingURL=app.js.map