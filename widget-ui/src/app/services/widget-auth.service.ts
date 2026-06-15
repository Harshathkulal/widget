import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class WidgetAuthService {
  private readonly http = inject(HttpClient);

  // SINGLE SOURCE OF TRUTH
  private apiBaseUrl = environment.apiBaseUrl;

  private readonly tokenSignal = signal<string | null>(null);

  // ─── Config ─────────────────────────────────────────────
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  setApiBaseUrl(url: string) {
    this.apiBaseUrl = url.replace(/\/$/, '');
  }

  // ─── Auth ───────────────────────────────────────────────
  getToken(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string | null) {
    this.tokenSignal.set(token);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal();
  }

  // ─── Session ────────────────────────────────────────────
  initSession(params: {
    appId: string;
    clientId: string;
  }): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(
        `${this.apiBaseUrl}/widget/init`,
        params
      )
      .pipe(
        tap((res) => this.setToken(res.token))
      );
  }

  revokeSession(): Observable<any> {
    return this.http
      .post(`${this.apiBaseUrl}/widget/revoke`, {})
      .pipe(
        tap(() => this.setToken(null))
      );
  }
}
