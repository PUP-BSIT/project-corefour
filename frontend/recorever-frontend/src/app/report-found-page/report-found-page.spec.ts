import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportFoundPage } from './report-found-page';

describe('ReportFoundPage', () => {
  let component: ReportFoundPage;
  let fixture: ComponentFixture<ReportFoundPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFoundPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportFoundPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
