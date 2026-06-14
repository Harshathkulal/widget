import { Component, output, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search.html',
  styleUrl: './user-search.scss',
})
export class UserSearch implements OnDestroy {
  search = output<string>();

  value = '';
  private readonly searchSubject = new Subject<string>();
  private readonly searchSubscription: Subscription;

  constructor() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.search.emit(term);
      });
  }

  onInput() {
    this.searchSubject.next(this.value);
  }

  clearSearch() {
    this.value = '';
    this.searchSubject.next('');
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe();
  }
}