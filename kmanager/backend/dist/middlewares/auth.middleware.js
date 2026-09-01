"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const jwt_util_1 = require("@utils/jwt.util");
/** Verifica que exista un JWT válido en el header Authorization. */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Token no proporcionado' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_util_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
}
/** Factory de middleware para restringir un endpoint a ciertos roles. */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ message: 'No tienes permisos para esta acción' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map