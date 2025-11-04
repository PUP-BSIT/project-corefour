import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemReportForm } from './item-report-form';

describe('ItemReportForm', () => {
  let component: ItemReportForm;
  let fixture: ComponentFixture<ItemReportForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemReportForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemReportForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
