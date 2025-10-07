import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Editor' | 'Author' | 'Reader';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:4000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          this.setUserData(response.user, response.tokens);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          this.setUserData(response.user, response.tokens);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<{ tokens: { accessToken: string; refreshToken: string } }> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<{ tokens: { accessToken: string; refreshToken: string } }>(
      `${this.API_URL}/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
      })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.API_URL}/me`).pipe(
      map(resp => resp.user),
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  private setUserData(user: User, tokens: { accessToken: string; refreshToken: string }): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}


