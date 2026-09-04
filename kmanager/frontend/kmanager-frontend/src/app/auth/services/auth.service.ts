import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse, Role } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'kmanager_access_token';
const REFRESH_TOKEN_KEY = 'kmanager_refresh_token';
const USER_KEY = 'kmanager_user';

interface DecodedToken {
  sub: string;
  username: string;
  role: Role;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // En el servidor (SSR) no hay localStorage, así que arrancamos sin usuario.
  // El navegador hidrata el estado real en el primer render del cliente.
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(
    this.isBrowser ? this.getStoredUser() : null
  );
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private tokenExpiredSubject = new BehaviorSubject<boolean>(false);
  readonly tokenExpired$ = this.tokenExpiredSubject.asObservable();

  private expirationCheckInterval: ReturnType<typeof setInterval> | null = null;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.setSession(response))
    );
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.tokenExpiredSubject.next(false);
    this.stopExpirationCheck();
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    const token = this.getAccessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  hasRole(role: Role): boolean {
    return this.getCurrentUser()?.role === role;
  }

  private setSession(response: LoginResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
    this.currentUserSubject.next(response.user);
    this.tokenExpiredSubject.next(false);
    this.startExpirationCheck();
  }

  private getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const nowInSeconds = Date.now() / 1000;
      return decoded.exp < nowInSeconds;
    } catch {
      return true;
    }
  }

  startExpirationCheck(): void {
    if (!this.isBrowser) return;
    this.stopExpirationCheck();
    this.expirationCheckInterval = setInterval(() => {
      const token = this.getAccessToken();
      if (token && this.isTokenExpired(token)) {
        this.tokenExpiredSubject.next(true);
        this.stopExpirationCheck();
      }
    }, 5000);
  }

  stopExpirationCheck(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = null;
    }
  }
}