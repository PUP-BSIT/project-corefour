import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimFormModal } from './claim-form-modal';

describe('ClaimFormModal', () => {
  let component: ClaimFormModal;
  let fixture: ComponentFixture<ClaimFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimFormModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClaimFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
