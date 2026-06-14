export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SortConfig {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue?: Partial<User> | null;
  newValue?: Partial<User> | null;
  performedBy: string;
  ipAddress?: string;
  createdAt: string;
}