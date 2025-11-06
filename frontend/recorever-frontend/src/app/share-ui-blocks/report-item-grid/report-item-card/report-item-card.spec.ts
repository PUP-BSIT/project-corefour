import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportItemCard } from './report-item-card';

describe('ReportItemCard', () => {
  let component: ReportItemCard;
  let fixture: ComponentFixture<ReportItemCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportItemCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportItemCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
