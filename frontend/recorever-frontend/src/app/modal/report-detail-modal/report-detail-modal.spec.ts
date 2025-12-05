import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportDetailModal } from './report-detail-modal';

describe('ReportDetailModal', () => {
  let component: ReportDetailModal;
  let fixture: ComponentFixture<ReportDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
