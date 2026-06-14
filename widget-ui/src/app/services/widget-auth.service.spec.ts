import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { WidgetAuthService } from './widget-auth.service';

describe('WidgetAuthService', () => {
  let service: WidgetAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WidgetAuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(WidgetAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return default API base URL', () => {
    expect(service.getApiBaseUrl()).toBe('http://localhost:3000/api');
  });

  it('should update API base URL and strip trailing slash', () => {
    service.setApiBaseUrl('http://custom.api/api/');

    expect(service.getApiBaseUrl()).toBe('http://custom.api/api');
  });

  it('should store and retrieve token', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.setToken('test-token');

    expect(service.getToken()).toBe('test-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should init session and store token from response', () => {
    const params = {
      appId: 'app-1',
      clientId: 'client-1',
      signature: 'sig',
      timestamp: Date.now(),
      nonce: 'nonce-1',
    };

    service.initSession(params).subscribe((res) => {
      expect(res.token).toBe('widget-token');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/widget/init');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(params);
    req.flush({ token: 'widget-token' });

    expect(service.getToken()).toBe('widget-token');
  });

  it('should revoke session and clear token', () => {
    service.setToken('test-token');

    service.revokeSession().subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/widget/revoke');
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
