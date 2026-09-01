"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.PostgresUserRepository = void 0;
const database_1 = require("@config/database");
/**
 * Repositorio de Usuarios conectado a PostgreSQL.
 */
class PostgresUserRepository {
    async findByUsername(username) {
        const res = await database_1.pool.query('SELECT id, username, email, password_hash AS "passwordHash", role FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
        if (res.rows.length === 0)
            return undefined;
        const row = res.rows[0];
        return {
            id: String(row.id),
            username: row.username,
            email: row.email,
            passwordHash: row.passwordHash,
            role: row.role,
        };
    }
    async findById(id) {
        const res = await database_1.pool.query('SELECT id, username, email, password_hash AS "passwordHash", role FROM users WHERE id = $1 LIMIT 1', [parseInt(id, 10)]);
        if (res.rows.length === 0)
            return undefined;
        const row = res.rows[0];
        return {
            id: String(row.id),
            username: row.username,
            email: row.email,
            passwordHash: row.passwordHash,
            role: row.role,
        };
    }
}
exports.PostgresUserRepository = PostgresUserRepository;
exports.userRepository = new PostgresUserRepository();
//# sourceMappingURL=user.repository.js.map