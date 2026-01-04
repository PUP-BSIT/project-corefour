import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessLostModal } from './success-lost-modal';

describe('SuccessLostModal', () => {
  let component: SuccessLostModal;
  let fixture: ComponentFixture<SuccessLostModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessLostModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuccessLostModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
