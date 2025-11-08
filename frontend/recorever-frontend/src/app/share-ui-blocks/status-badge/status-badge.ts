import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ItemStatus = 'Verified' | 'Claimed' | 'Pending';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {

  @Input() status: ItemStatus = 'Pending';
}
