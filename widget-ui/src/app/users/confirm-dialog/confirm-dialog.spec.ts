import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should use default input values', () => {
    expect(component.title()).toBe('Confirm Action');
    expect(component.message()).toBe(
      'Are you sure you want to perform this action?',
    );
    expect(component.confirmText()).toBe('Confirm');
    expect(component.cancelText()).toBe('Cancel');
    expect(component.isDanger()).toBe(false);
  });

  it('should emit confirm event', () => {
    const confirmed: boolean[] = [];
    component.confirm.subscribe(() => confirmed.push(true));

    component.onConfirm();

    expect(confirmed).toEqual([true]);
  });

  it('should emit cancel event', () => {
    const cancelled: boolean[] = [];
    component.cancel.subscribe(() => cancelled.push(true));

    component.onCancel();

    expect(cancelled).toEqual([true]);
  });

  it('should emit cancel on escape key', () => {
    const cancelled: boolean[] = [];
    component.cancel.subscribe(() => cancelled.push(true));

    component.onEscape();

    expect(cancelled).toEqual([true]);
  });
});
