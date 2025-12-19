import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { AdminService } from '../../../core/services/admin-service';
import { DashboardData } from '../../../models/admin-stats-model';
import { StatsCardComponent } from './stats-card/stats-card';
import { ChartComponent } from './chart-component/chart-component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    StatsCardComponent, 
    ChartComponent 
  ],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
})
export class AdminDashboardPage implements OnInit {
  private adminService = inject(AdminService);
  
  dashboardData: DashboardData | null = null;
  selectedRange = '15'; 

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.adminService.getDashboardData(this.selectedRange).subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
      },
      error: (err: unknown) => {
        console.error('Failed to load dashboard', err);
      },
    });
  }

  onRangeChange(): void {
    this.fetchDashboardData();
  }
}