import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { WidgetAuthService } from '../services/widget-auth.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        WidgetAuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch paginated users', () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          status: 'ACTIVE',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };

    service
      .getUsers({ page: 1, limit: 10, search: 'john', sortBy: 'email', sortOrder: 'ASC' })
      .subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${apiBase}/widget/users` &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '10' &&
        r.params.get('search') === 'john' &&
        r.params.get('sortBy') === 'email' &&
        r.params.get('sortOrder') === 'ASC',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a user', () => {
    const newUser = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      status: 'ACTIVE' as const,
    };

    service.createUser(newUser).subscribe((res) => {
      expect(res.email).toBe('jane@test.com');
    });

    const req = httpMock.expectOne(`${apiBase}/widget/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush({ id: '2', ...newUser });
  });

  it('should update a user', () => {
    service.updateUser('user-1', { firstName: 'Updated' }).subscribe((res) => {
      expect(res.firstName).toBe('Updated');
    });

    const req = httpMock.expectOne(`${apiBase}/widget/users/user-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'user-1', firstName: 'Updated' });
  });

  it('should delete a user', () => {
    service.deleteUser('user-1').subscribe((res) => {
      expect(res.message).toBe('User deleted successfully');
    });

    const req = httpMock.expectOne(`${apiBase}/widget/users/user-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User deleted successfully' });
  });

  it('should bulk delete users', () => {
    service.deleteUsersBulk(['user-1', 'user-2']).subscribe();

    const req = httpMock.expectOne(`${apiBase}/widget/users/bulk`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ ids: ['user-1', 'user-2'] });
    req.flush({ message: '2 users deleted successfully' });
  });

  it('should bulk update user status', () => {
    service.updateUsersStatusBulk(['user-1'], 'INACTIVE').subscribe();

    const req = httpMock.expectOne(`${apiBase}/widget/users/bulk-status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ids: ['user-1'], status: 'INACTIVE' });
    req.flush({ message: '1 users status updated to INACTIVE successfully' });
  });

  it('should fetch user audit logs', () => {
    const mockAudit = [
      { id: 'audit-1', action: 'CREATE', entityType: 'user', entityId: 'user-1' },
    ];

    service.getUserAudit('user-1').subscribe((res) => {
      expect(res).toEqual(mockAudit);
    });

    const req = httpMock.expectOne(`${apiBase}/widget/audit/user/user-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAudit);
  });
});
