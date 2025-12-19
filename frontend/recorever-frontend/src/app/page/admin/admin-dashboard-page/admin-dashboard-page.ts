import { 
  Component, 
  inject, 
  OnInit, 
  ChangeDetectorRef,
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup 
} from '@angular/forms';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { AdminService } from '../../../core/services/admin-service';
import { DashboardData } from '../../../models/admin-stats-model';
import { StatsCardComponent } from './stats-card/stats-card';
import { ChartComponent } from './chart-component/chart-component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatsCardComponent,
    ChartComponent
  ],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
})
export class AdminDashboardPage implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  
  private destroy$ = new Subject<void>();

  dashboardData: DashboardData | null = null;

  filterForm: FormGroup = this.fb.group({
    range: ['15'] 
  });

  ngOnInit(): void {
    this.loadData(this.filterForm.get('range')?.value);

    this.filterForm.get('range')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      switchMap((range) => {
        return this.adminService.getDashboardData(range);
      })
    ).subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        console.error('Failed to load dashboard', err);
      }
    });
  }

  private loadData(range: string): void {
    this.adminService.getDashboardData(range)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.cdr.markForCheck();
        },
        error: (err) => console.error(err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}