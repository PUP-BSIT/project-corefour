import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LostStatusPage } from './lost-status-page';

describe('LostStatusPage', () => {
  let component: LostStatusPage;
  let fixture: ComponentFixture<LostStatusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LostStatusPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LostStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
