import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  templateUrl: './stats-card.html',
  styleUrl: './stats-card.scss',
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() count: number | string = 0; 
  @Input() icon: string = '';
}