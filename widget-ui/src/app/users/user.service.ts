import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, PaginatedResponse, AuditLogEntry } from './user.types';
import { WidgetAuthService } from '../services/widget-auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(WidgetAuthService);

  private get apiBaseUrl(): string {
    return this.auth.getApiBaseUrl();
  }

  // ─── Users ─────────────────────────────────────────────
  getUsers(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  }): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http.get<PaginatedResponse<User>>(
      `${this.apiBaseUrl}/widget/users`,
      { params: httpParams }
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(
      `${this.apiBaseUrl}/widget/users`,
      user
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(
      `${this.apiBaseUrl}/widget/users/${id}`,
      user
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiBaseUrl}/widget/users/${id}`
    );
  }

  deleteUsersBulk(ids: string[]): Observable<any> {
    return this.http.delete(
      `${this.apiBaseUrl}/widget/users/bulk`,
      { body: { ids } }
    );
  }

  updateUsersStatusBulk(ids: string[], status: string): Observable<any> {
    return this.http.patch(
      `${this.apiBaseUrl}/widget/users/bulk-status`,
      { ids, status }
    );
  }

  getUserAudit(userId: string): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(
      `${this.apiBaseUrl}/widget/audit/user/${userId}`
    );
  }
}