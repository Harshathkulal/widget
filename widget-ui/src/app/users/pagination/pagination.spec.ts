import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let component: Pagination;
  let fixture: ComponentFixture<Pagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalItems', 25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
  });

  it('should compute total pages', () => {
    expect(component.totalPages()).toBe(3);
  });

  it('should compute showing range', () => {
    expect(component.showingStart()).toBe(1);
    expect(component.showingEnd()).toBe(10);
  });

  it('should return 0 for showingStart when no items', () => {
    fixture.componentRef.setInput('totalItems', 0);
    fixture.detectChanges();

    expect(component.showingStart()).toBe(0);
  });

  it('should emit pageChange when navigating to a new page', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    component.goToPage(2);

    expect(emitted).toEqual([2]);
  });

  it('should not emit pageChange when clicking current page', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    component.goToPage(1);

    expect(emitted).toEqual([]);
  });

  it('should emit previous page', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.detectChanges();

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    component.prevPage();

    expect(emitted).toEqual([1]);
  });

  it('should emit next page', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    component.nextPage();

    expect(emitted).toEqual([2]);
  });
});
