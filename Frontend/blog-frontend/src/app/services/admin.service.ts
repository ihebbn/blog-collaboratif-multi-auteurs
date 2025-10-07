import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Editor' | 'Author' | 'Reader';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_URL = 'http://localhost:4000/api/admin';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<{ users: AdminUser[] }> {
    return this.http.get<{ users: AdminUser[] }>(`${this.API_URL}/users`);
  }

  updateUserRole(userId: string, role: AdminUser['role']): Observable<{ message: string }>{
    return this.http.put<{ message: string }>(`${this.API_URL}/users/${userId}/role`, { role });
  }

  updateUserStatus(userId: string, status: AdminUser['status']): Observable<{ message: string }>{
    return this.http.put<{ message: string }>(`${this.API_URL}/users/${userId}/status`, { status });
  }
}


