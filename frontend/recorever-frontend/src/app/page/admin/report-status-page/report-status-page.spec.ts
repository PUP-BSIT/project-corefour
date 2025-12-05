import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportStatusPage } from './report-status-page';

describe('ReportStatusPage', () => {
  let component: ReportStatusPage;
  let fixture: ComponentFixture<ReportStatusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportStatusPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
