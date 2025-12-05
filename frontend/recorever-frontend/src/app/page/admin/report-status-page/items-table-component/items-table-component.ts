import { Component, inject, Signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActionMenuComponent }
    from './action-menu-component/action-menu-component';
import { ItemService } from '../../../../core/services/item-service';
import { Report, ReportFilters } from '../../../../models/item-model';
import { catchError, startWith, map, forkJoin, of, Observable } from 'rxjs';

type ReportsState = {
  reports: Report[];
  loading: boolean;
  error: boolean;
};

@Component({
  selector: 'app-items-table-component',
  standalone: true,
  imports: [CommonModule, ActionMenuComponent, TitleCasePipe],
  templateUrl: './items-table-component.html',
  styleUrls: ['./items-table-component.scss'],
})
export class ItemsTableComponent {
  protected state: Signal<ReportsState>;
  private readonly reportsState$: Observable<ReportsState>;
  private readonly itemService = inject(ItemService);

  constructor() {
    const combos: ReportFilters[] = [
      { type: 'lost', status: 'pending' },
      { type: 'found', status: 'pending' },
      { type: 'lost', status: 'approved' },
      { type: 'found', status: 'approved' },
      { type: 'lost', status: 'matched' },
      { type: 'found', status: 'matched' },
    ];

    const observables = combos.map(c =>
      this.itemService.getReports(c).pipe(catchError(() => of([] as Report[])))
    );

    const allReports$ = forkJoin(observables).pipe(
      map(results => {
        const combined = results.flat();
        const unique = new Map<number, Report>();

        for (const report of combined) {
          if (!report || report.report_id == null) continue;
          unique.set(Number(report.report_id), report);
        }

        const finalReports = Array.from(unique.values()).filter(report =>
          report.status === 'pending' ||
          report.status === 'approved' ||
          report.status === 'matched'
        );

        return finalReports.sort((reportA, reportB) =>
          (Date.parse(reportB.date_reported || '') || 0) -
          (Date.parse(reportA.date_reported || '') || 0)
        );
      })
    );

    this.reportsState$ = allReports$.pipe(
      map(reports => ({ reports, loading: false, error: false } as ReportsState)),
      startWith({ reports: [], loading: true, error: false } as ReportsState),
      catchError(err => {
        console.error('Error fetching admin reports:', err);
        return of({ reports: [], loading: false, error: true } as ReportsState);
      })
    );

    this.state = toSignal(this.reportsState$, {
      initialValue: { reports: [], loading: true, error: false } as ReportsState
    });
  }

  getDisplayStatus(status: Report['status']): string {
    if (status === 'approved') {
      return 'Verified';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getDisplayStatusClass(status: Report['status']): string {
    if (status === 'approved') {
      return 'verified';
    }
    return status;
  }
}

