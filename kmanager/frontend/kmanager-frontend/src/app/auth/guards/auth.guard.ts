import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

/**
 * Guard base: exige sesión activa (token válido, no expirado).
 * Uso en rutas: canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { expired: 'true' } });
  return false;
};

/**
 * Guard factory por rol. Uso en rutas:
 * canActivate: [roleGuard([Role.ADMIN])]
 */
export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { expired: 'true' } });
      return false;
    }

    const user = authService.getCurrentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
}
