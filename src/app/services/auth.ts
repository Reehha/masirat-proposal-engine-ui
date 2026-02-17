import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

type Role = 'ADMIN' | 'USER' | string;

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  uid: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'masirat_auth';
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Calls Spring Boot:
   * POST /api/auth/login
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, body)
      .pipe(
        tap((res) => {
          // store everything we need
          localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify({
              token: res.token,
              uid: res.uid,
              email: res.email,
              role: res.role,
            })
          );
          localStorage.removeItem('mustResetPassword');
        })
      );
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getAuthData(): { token: string; uid: string; email: string; role: Role } | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
  
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  
  getToken(): string | null {
    const data = this.getAuthData();
    return data?.token || null;
  }
  
  getRole(): Role | null {
    const data = this.getAuthData();
    return (data?.role as Role) || null;
  }
  

  hasAnyRole(roles: string[]): boolean {
    const role = this.getRole();
    return !!role && roles.includes(role);
  }

  register(data: {
    firstName: string;
    lastName: string;
    dob: string;
    email: string;
    gender: string;
    phoneNumber: string;
    nationality: string;
    address: string;
    password: string;
    role: string;
  }) {
    return this.http
      .post<any>(`${this.baseUrl}/auth/register`, data)
      .pipe(
        tap((res) => {
          // Backend returns token as well → auto login after register
          localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify({
              token: res.token,
              uid: res.uid,
              email: res.email,
              role: res.role,
            })
          );
        })
      );
  }
  
}
