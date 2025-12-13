import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimStatusPage } from './claim-status-page';

describe('ClaimStatusPage', () => {
  let component: ClaimStatusPage;
  let fixture: ComponentFixture<ClaimStatusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimStatusPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClaimStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
