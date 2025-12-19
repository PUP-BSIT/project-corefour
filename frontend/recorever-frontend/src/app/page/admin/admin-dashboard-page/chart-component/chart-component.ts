import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData } from '../../../../models/admin-stats-model';

@Component({
  selector: 'app-chart-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-component.html',
  styleUrl: './chart-component.scss',
})
export class ChartComponent {
  @Input() data: ChartData[] = [];
}