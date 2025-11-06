import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportButton } from './report-button';

describe('ReportButton', () => {
  let component: ReportButton;
  let fixture: ComponentFixture<ReportButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
