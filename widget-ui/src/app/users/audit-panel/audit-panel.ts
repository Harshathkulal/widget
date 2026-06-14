import { Component, OnInit, input, output, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';
import { AuditLogEntry } from '../user.types';

@Component({
  selector: 'app-audit-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-panel.html',
  styleUrl: './audit-panel.scss',
})
export class AuditPanel implements OnInit {
  private readonly userService = inject(UserService);

  userId = input.required<string>();
  userName = input.required<string>();
  close = output<void>();

  auditLogs = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadAuditHistory();
  }

  loadAuditHistory() {
    this.loading.set(true);
    this.error.set(null);
    this.userService.getUserAudit(this.userId()).subscribe({
      next: (logs) => {
        this.auditLogs.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load audit logs');
        this.loading.set(false);
      },
    });
  }

  onClose() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.onClose();
  }

  formatValues(value: any): string {
    if (!value) return '';
    const result: string[] = [];
    for (const key of Object.keys(value)) {
      if (['id', 'tenantId', 'applicationId', 'createdAt', 'updatedAt', 'deletedAt', 'tenant_id', 'application_id', 'created_at', 'updated_at', 'deleted_at'].includes(key)) {
        continue;
      }
      result.push(`${key}: ${value[key]}`);
    }
    return result.join(', ');
  }
}
