import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast message', () => {
    service.show('Test message', 'success');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].text).toBe('Test message');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should add success toast via helper', () => {
    service.success('Saved successfully');

    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].text).toBe('Saved successfully');
  });

  it('should add error toast via helper', () => {
    service.error('Something went wrong');

    expect(service.toasts()[0].type).toBe('error');
  });

  it('should dismiss a toast by id', () => {
    service.show('Dismiss me');
    const id = service.toasts()[0].id;

    service.dismiss(id);

    expect(service.toasts().length).toBe(0);
  });
});
