import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { UserService } from '../users/user.service';
import { WidgetAuthService } from '../services/widget-auth.service';
import { ToastService } from '../services/toast.service';

import { UserTable } from '../users/user-table/user-table';
import { UserSearch } from '../users/user-search/user-search';
import { Pagination } from '../users/pagination/pagination';
import { UserFormModal } from '../users/user-form-modal/user-form-modal';
import { ConfirmDialog } from '../users/confirm-dialog/confirm-dialog';
import { LoadingSkeleton } from '../users/loading-skeleton/loading-skeleton';
import { Toast } from '../users/toast/toast';
import { AuditPanel } from '../users/audit-panel/audit-panel';
import { environment } from '../../environment';
import { User, SortConfig } from '../users/user.types';

type WidgetState = 'init' | 'loading' | 'ready' | 'error' | 'session-expired';

@Component({
  selector: 'user-management-widget',
  standalone: true,
  imports: [
    CommonModule,
    UserTable,
    UserSearch,
    Pagination,
    UserFormModal,
    ConfirmDialog,
    LoadingSkeleton,
    Toast,
    AuditPanel,
  ],
  templateUrl: './widget.html',
  styleUrl: './widget.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class Widget implements OnInit, OnDestroy {
  // Like React props: values passed from <user-management-widget ...>.
  appId = input('');
  clientId = input('');
  theme = input('light');
  pageSize = input(10);
  apiUrl = input(environment.apiBaseUrl);
  signature = input('');

  // Like injected API clients.
  private readonly userService = inject(UserService);
  private readonly widgetAuthService = inject(WidgetAuthService);
  readonly toastService = inject(ToastService);

  // Like React useState().
  widgetState = signal<WidgetState>('init');
  errorMessage = signal('');

  users = signal<User[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  searchTerm = signal('');
  sortConfig = signal<SortConfig>({ sortBy: 'createdAt', sortOrder: 'DESC' });
  selectedUserIds = signal<string[]>([]);

  showFormModal = signal(false);
  showConfirmDialog = signal(false);
  showAuditPanel = signal(false);
  editingUser = signal<User | null>(null);
  deletingUser = signal<User | null>(null);
  auditUser = signal<User | null>(null);
  bulkDeletePending = signal(false);
  bulkStatusPending = signal<string | null>(null);

  // Like React useMemo().
  isLoading = computed(() => this.widgetState() === 'init' || this.widgetState() === 'loading');
  isReady = computed(() => this.widgetState() === 'ready');
  isError = computed(() => this.widgetState() === 'error');
  isSessionExpired = computed(() => this.widgetState() === 'session-expired');
  hasSelection = computed(() => this.selectedUserIds().length > 0);
  selectionCount = computed(() => this.selectedUserIds().length);

  private subscriptions = new Subscription();

  ngOnInit() {
    this.initializeWidget();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // ─── Widget Initialization ─────────────────────────────────────────────────

  private initializeWidget() {
    const appId = this.appId();
    const clientId = this.clientId();
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    const signature = this.signature();

    this.widgetAuthService.setApiBaseUrl(this.apiUrl());

    const sub = this.widgetAuthService
      .initSession({ appId, clientId, signature, timestamp, nonce })
      .subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          console.error('Widget session init failed:', err);
          this.widgetState.set('error');
          this.errorMessage.set(
            err?.error?.message || 'Failed to initialize widget. Check your appId and clientId.'
          );
        },
      });
    this.subscriptions.add(sub);
  }

  private generateNonce(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ─── Data Loading ──────────────────────────────────────────────────────────

  loadUsers(page?: number) {
    if (page) this.currentPage.set(page);
    this.widgetState.set('loading');

    const sub = this.userService
      .getUsers({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchTerm(),
        sortBy: this.sortConfig().sortBy,
        sortOrder: this.sortConfig().sortOrder,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.totalItems.set(res.total);
          this.widgetState.set('ready');
        },
        error: (err) => {
          if (err.status === 401) {
            this.widgetState.set('session-expired');
          } else {
            this.widgetState.set('error');
            this.errorMessage.set('Failed to load users. Please try again.');
          }
        },
      });
    this.subscriptions.add(sub);
  }

  // ─── Event Handlers ────────────────────────────────────────────────────────

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.loadUsers(page);
  }

  onSortChange(sort: SortConfig) {
    this.sortConfig.set(sort);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSelectionChange(ids: string[]) {
    this.selectedUserIds.set(ids);
  }

  // ─── CRUD Operations ───────────────────────────────────────────────────────

  openAddUserModal() {
    this.editingUser.set(null);
    this.showFormModal.set(true);
  }

  openEditUserModal(user: User) {
    this.editingUser.set(user);
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
    this.editingUser.set(null);
  }

  onSaveUser(data: Partial<User>) {
    const editing = this.editingUser();
    if (editing) {
      const sub = this.userService.updateUser(editing.id, data).subscribe({
        next: () => {
          this.toastService.success('User updated successfully');
          this.closeFormModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Failed to update user');
        },
      });
      this.subscriptions.add(sub);
    } else {
      const sub = this.userService.createUser(data).subscribe({
        next: () => {
          this.toastService.success('User created successfully');
          this.closeFormModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Failed to create user');
        },
      });
      this.subscriptions.add(sub);
    }
  }

  openDeleteDialog(user: User) {
    this.deletingUser.set(user);
    this.bulkDeletePending.set(false);
    this.showConfirmDialog.set(true);
  }

  openBulkDeleteDialog() {
    this.bulkDeletePending.set(true);
    this.showConfirmDialog.set(true);
  }

  openBulkStatusDialog(status: string) {
    this.bulkStatusPending.set(status);
    this.showConfirmDialog.set(true);
  }

  closeConfirmDialog() {
    this.showConfirmDialog.set(false);
    this.deletingUser.set(null);
    this.bulkDeletePending.set(false);
    this.bulkStatusPending.set(null);
  }

  onConfirmAction() {
    if (this.bulkDeletePending()) {
      this.executeBulkDelete();
    } else if (this.bulkStatusPending()) {
      this.executeBulkStatusChange(this.bulkStatusPending()!);
    } else if (this.deletingUser()) {
      this.executeDeleteUser(this.deletingUser()!);
    }
    this.closeConfirmDialog();
  }

  private executeDeleteUser(user: User) {
    const sub = this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.toastService.success(`${user.firstName} ${user.lastName} deleted`);
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete user');
      },
    });
    this.subscriptions.add(sub);
  }

  private executeBulkDelete() {
    const ids = this.selectedUserIds();
    const sub = this.userService.deleteUsersBulk(ids).subscribe({
      next: () => {
        this.toastService.success(`${ids.length} users deleted`);
        this.selectedUserIds.set([]);
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete users');
      },
    });
    this.subscriptions.add(sub);
  }

  private executeBulkStatusChange(status: string) {
    const ids = this.selectedUserIds();
    const sub = this.userService.updateUsersStatusBulk(ids, status).subscribe({
      next: () => {
        this.toastService.success(`${ids.length} users set to ${status}`);
        this.selectedUserIds.set([]);
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update status');
      },
    });
    this.subscriptions.add(sub);
  }

  openAuditPanel(user: User) {
    this.auditUser.set(user);
    this.showAuditPanel.set(true);
  }

  closeAuditPanel() {
    this.showAuditPanel.set(false);
    this.auditUser.set(null);
  }

  retryInit() {
    this.widgetState.set('init');
    this.errorMessage.set('');
    this.initializeWidget();
  }

  // ─── Confirm Dialog Helpers ────────────────────────────────────────────────

  get confirmTitle(): string {
    if (this.bulkDeletePending()) return `Delete ${this.selectionCount()} Users`;
    if (this.bulkStatusPending()) return `Change Status to ${this.bulkStatusPending()}`;
    const u = this.deletingUser();
    return u ? `Delete ${u.firstName} ${u.lastName}` : 'Confirm';
  }

  get confirmMessage(): string {
    if (this.bulkDeletePending()) {
      return `Are you sure you want to permanently delete ${this.selectionCount()} selected users? This action cannot be undone.`;
    }
    if (this.bulkStatusPending()) {
      return `Are you sure you want to set ${this.selectionCount()} users to ${this.bulkStatusPending()}?`;
    }
    const u = this.deletingUser();
    return u ? `Are you sure you want to delete ${u.firstName} ${u.lastName}? This action cannot be undone.` : '';
  }
}
