import { Request, Response } from 'express';
import { authService, InvalidCredentialsError } from '@services/auth.service';

export class AuthController {
  async login(req: Request, res: Response): Promise<Response> {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({
        message: 'Los campos "username" y "password" son obligatorios',
      });
    }

    try {
      const result = await authService.login(username, password);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return res.status(401).json({ message: error.message });
      }
      console.error('[AuthController.login] Error inesperado:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  /** Endpoint de conveniencia para que el frontend valide la sesión activa. */
  async me(req: Request, res: Response): Promise<Response> {
    // req.user es inyectado por authMiddleware
    return res.status(200).json({ user: (req as any).user });
  }
}

export const authController = new AuthController();
