import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimStatusManagement } from './claim-status-management';

describe('ClaimStatusManagement', () => {
  let component: ClaimStatusManagement;
  let fixture: ComponentFixture<ClaimStatusManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimStatusManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClaimStatusManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
