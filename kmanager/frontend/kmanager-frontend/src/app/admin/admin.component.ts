import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; padding: 2rem; background-color: #1e293b; background-image: linear-gradient(to bottom right, #0f172a, #1e293b); font-family: 'Inter', sans-serif; box-sizing: border-box;">
      <div style="width: 100%; max-width: 420px; background-color: #ffffff; border-radius: 2rem; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; align-items: center; text-align: center; box-sizing: border-box;">
        
        @if (sessionExpired()) {
          <div style="width: 64px; height: 64px; min-width: 64px; min-height: 64px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center; color: #dc2626; margin-bottom: 1.5rem;">
            <svg style="width: 32px; height: 32px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>

          <h1 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem 0; letter-spacing: -0.025em;">
            Sesión expirada
          </h1>

          <div style="margin-bottom: 2rem; color: #475569; font-size: 0.95rem; line-height: 1.5;">
            <p style="margin: 0;">
              Tu sesión ha expirado. Por favor, haz clic en continuar para iniciar sesión nuevamente.
            </p>
          </div>

          <button
            style="width: 100%; padding: 0.875rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; color: #ffffff; background-color: #2563eb; border: none; cursor: pointer; transition: background-color 0.2s;"
            (click)="onContinue()"
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'">
            Continuar
          </button>
        } @else {
          <div style="width: 64px; height: 64px; min-width: 64px; min-height: 64px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; color: #059669; margin-bottom: 1.5rem;">
            <svg style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem 0; letter-spacing: -0.025em;">
            Inicio de sesión exitoso
          </h1>

          <div style="margin-bottom: 2rem; color: #475569; font-size: 0.95rem; line-height: 1.5;">
            <p style="margin: 0 0 0.5rem 0;">
              Bienvenido, <span style="color: #0f172a; font-weight: 700;">Administrador General</span>
            </p>
            <p style="margin: 0;">
              Rol: <span style="color: #059669; font-weight: 700; text-transform: uppercase;">{{ user()?.role ?? 'admin' }}</span>
            </p>
          </div>

          <button
            style="width: 100%; padding: 0.875rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; color: #ffffff; background-color: #1e293b; border: none; cursor: pointer; transition: background-color 0.2s;"
            (click)="onLogout()"
            onmouseover="this.style.backgroundColor='#0f172a'"
            onmouseout="this.style.backgroundColor='#1e293b'">
            Cerrar sesión
          </button>
        }

      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  readonly sessionExpired = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.startExpirationCheck();
    this.subscription.add(
      this.authService.tokenExpired$.subscribe((expired) => {
        this.sessionExpired.set(expired);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  user() {
    return this.authService.getCurrentUser();
  }

  onContinue(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
