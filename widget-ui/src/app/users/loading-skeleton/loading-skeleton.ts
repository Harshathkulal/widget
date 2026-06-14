import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.html',
  styleUrl: './loading-skeleton.scss',
})
export class LoadingSkeleton {
  rows = input<number>(5);

  getSkeletonRows(): number[] {
    return Array(this.rows()).fill(0);
  }
}
