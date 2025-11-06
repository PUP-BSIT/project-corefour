import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodesModal } from './codes-modal';

describe('CodesModal', () => {
  let component: CodesModal;
  let fixture: ComponentFixture<CodesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodesModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodesModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
