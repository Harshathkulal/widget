import { Component, OnInit, input, output, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../user.types';

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form-modal.html',
  styleUrl: './user-form-modal.scss',
})
export class UserFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  user = input<User | null>(null);
  save = output<Partial<User>>();
  cancel = output<void>();

  userForm!: FormGroup;

  ngOnInit() {
    const defaultData = this.user();
    this.userForm = this.fb.group({
      firstName: [defaultData?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [defaultData?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [defaultData?.email || '', [Validators.required, Validators.email]],
      status: [defaultData?.status || 'ACTIVE', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.save.emit(this.userForm.value);
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.onCancel();
  }
}
