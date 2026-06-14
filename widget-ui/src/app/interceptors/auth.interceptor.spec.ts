import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { WidgetAuthService } from '../services/widget-auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: WidgetAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WidgetAuthService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(WidgetAuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization header for API requests when token exists', () => {
    authService.setToken('my-jwt-token');

    http.get(`${authService.getApiBaseUrl()}/widget/users`).subscribe();

    const req = httpMock.expectOne(`${authService.getApiBaseUrl()}/widget/users`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should not attach Authorization header when token is missing', () => {
    http.get(`${authService.getApiBaseUrl()}/widget/users`).subscribe();

    const req = httpMock.expectOne(`${authService.getApiBaseUrl()}/widget/users`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not attach Authorization header for external URLs', () => {
    authService.setToken('my-jwt-token');

    http.get('https://external.api.com/data').subscribe();

    const req = httpMock.expectOne('https://external.api.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
