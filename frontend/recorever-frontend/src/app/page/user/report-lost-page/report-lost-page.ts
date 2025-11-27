import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ItemReportForm }
    from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission } from '../../../models/item-model';

@Component({
  selector: 'app-report-lost-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm],
  templateUrl: './report-lost-page.html',
  styleUrls: ['./report-lost-page.scss']
})
export class ReportLostPage {

  private router = inject(Router);

  handleSubmission(data: FinalReportSubmission): void {
    console.log('Lost Report Submitted:', data);
    this.router.navigate(['/app/lost-items']);
  }

  handleCancel(): void {
    this.router.navigate(['/app/lost-items']);
  }
}