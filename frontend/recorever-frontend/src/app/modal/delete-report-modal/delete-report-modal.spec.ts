import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteReportModal } from './delete-report-modal';

describe('DeleteReportModal', () => {
  let component: DeleteReportModal;
  let fixture: ComponentFixture<DeleteReportModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteReportModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteReportModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
