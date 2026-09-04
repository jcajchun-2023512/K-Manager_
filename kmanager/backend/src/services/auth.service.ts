import bcrypt from 'bcryptjs';
import { userRepository } from '@repositories/user.repository';
import { toSafeUser, SafeUser } from '@models/user.model';
import { signAccessToken, signRefreshToken } from '@utils/jwt.util';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Usuario o contraseña incorrectos');
    this.name = 'InvalidCredentialsError';
  }
}

export interface LoginResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const payload = { sub: user.id, username: user.username, role: user.role };

    return {
      user: toSafeUser(user),
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }
}

export const authService = new AuthService();
