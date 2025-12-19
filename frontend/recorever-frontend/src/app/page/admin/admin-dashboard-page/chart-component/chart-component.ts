import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  registerables,
} from 'chart.js';
import { ReportStat } from '../../../../models/admin-stats-model';

@Component({
  selector: 'app-chart-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-component.html',
  styleUrl: './chart-component.scss',
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: ReportStat[] = [];

  @ViewChild('chartCanvas')
  private chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly elementRef = inject(ElementRef);
  private chart: Chart | null = null;

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    if (this.data && this.data.length > 0) {
      this.initChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      if (this.chart) {
        this.updateChartData();
      } else {
        this.initChart();
      }
    }
  }

  private initChart(): void {
    if (!this.chartCanvas) return;

    const ctx: CanvasRenderingContext2D | null =
      this.chartCanvas.nativeElement.getContext('2d');

    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    const primaryColor = this.getCssVar('--chart-primary');
    const textColor = this.getCssVar('--chart-text');
    const gridColor = this.getCssVar('--chart-grid');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.data.map((d) => d.date),
        datasets: [
          {
            label: 'Reports',
            data: this.data.map((d) => d.count),
            borderColor: primaryColor,
            backgroundColor: primaryColor,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: primaryColor,
            tension: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: textColor },
            grid: { color: gridColor },
          },
          x: {
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 45,
            },
            grid: { display: false },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChartData(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.data.map((d) => d.date);
    this.chart.data.datasets[0].data = this.data.map((d) => d.count);
    this.chart.update();
  }

  private getCssVar(variableName: string): string {
    return getComputedStyle(this.elementRef.nativeElement)
      .getPropertyValue(variableName)
      .trim();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}