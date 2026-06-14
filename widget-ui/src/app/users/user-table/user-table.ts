import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, SortConfig } from '../user.types';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss',
})
export class UserTable {
  users = input.required<User[]>();
  sortConfig = input<SortConfig>({ sortBy: 'createdAt', sortOrder: 'DESC' });

  edit = output<User>();
  delete = output<User>();
  viewHistory = output<User>();
  sortChange = output<SortConfig>();
  selectionChange = output<string[]>();

  selectedIds = signal<Set<string>>(new Set());

  selectedCount = computed(() => this.selectedIds().size);
  allSelected = computed(() =>
    this.users().length > 0 && this.users().every((u) => this.selectedIds().has(u.id))
  );
  selectedUserIds = computed(() => Array.from(this.selectedIds()));

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.set(new Set(this.users().map((u) => u.id)));
    } else {
      this.selectedIds.set(new Set());
    }
    this.selectionChange.emit(this.selectedUserIds());
  }

  toggleRow(userId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current = new Set(this.selectedIds());
    if (checked) {
      current.add(userId);
    } else {
      current.delete(userId);
    }
    this.selectedIds.set(current);
    this.selectionChange.emit(this.selectedUserIds());
  }

  isSorted(field: string): 'asc' | 'desc' | null {
    const config = this.sortConfig();
    if (config.sortBy === field) {
      return config.sortOrder === 'ASC' || config.sortOrder === 'asc' ? 'asc' : 'desc';
    }
    return null;
  }

  onSort(field: string) {
    const current = this.sortConfig();
    const isSameField = current.sortBy === field;
    const newOrder = isSameField && (current.sortOrder === 'ASC' || current.sortOrder === 'asc') ? 'DESC' : 'ASC';
    this.sortChange.emit({ sortBy: field, sortOrder: newOrder });
  }

  clearSelection() {
    this.selectedIds.set(new Set());
    this.selectionChange.emit([]);
  }
}