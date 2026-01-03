import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPassPage } from './forgot-pass-page';

describe('ForgotPassPage', () => {
  let component: ForgotPassPage;
  let fixture: ComponentFixture<ForgotPassPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPassPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
