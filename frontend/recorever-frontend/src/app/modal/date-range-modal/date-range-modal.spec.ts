import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRangeModal } from './date-range-modal';

describe('DateRangeModal', () => {
  let component: DateRangeModal;
  let fixture: ComponentFixture<DateRangeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateRangeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
