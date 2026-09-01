import { pool } from '@config/database';
import { Role, User } from '@models/user.model';

export interface IUserRepository {
  findByUsername(username: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
}

/**
 * Repositorio de Usuarios conectado a PostgreSQL.
 */
export class PostgresUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | undefined> {
    const res = await pool.query(
      'SELECT id, username, email, password_hash AS "passwordHash", role FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [username]
    );

    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: String(row.id),
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as Role,
    };
  }

  async findById(id: string): Promise<User | undefined> {
    const res = await pool.query(
      'SELECT id, username, email, password_hash AS "passwordHash", role FROM users WHERE id = $1 LIMIT 1',
      [parseInt(id, 10)]
    );

    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: String(row.id),
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as Role,
    };
  }
}

export const userRepository: IUserRepository = new PostgresUserRepository();
