import { Component, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to perform this action?');
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');
  isDanger = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.onCancel();
  }
}
