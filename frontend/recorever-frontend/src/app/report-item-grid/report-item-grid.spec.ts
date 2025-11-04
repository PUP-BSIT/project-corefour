import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportItemGrid } from './report-item-grid';

describe('ReportItemGrid', () => {
  let component: ReportItemGrid;
  let fixture: ComponentFixture<ReportItemGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportItemGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportItemGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
