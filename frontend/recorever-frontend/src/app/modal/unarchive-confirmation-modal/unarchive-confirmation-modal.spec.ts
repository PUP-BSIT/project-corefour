import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnarchiveConfirmationModal } from './unarchive-confirmation-modal';

describe('UnarchiveConfirmationModal', () => {
  let component: UnarchiveConfirmationModal;
  let fixture: ComponentFixture<UnarchiveConfirmationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnarchiveConfirmationModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnarchiveConfirmationModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
