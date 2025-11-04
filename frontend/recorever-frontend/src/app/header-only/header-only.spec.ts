import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderOnly } from './header-only';

describe('HeaderOnly', () => {
  let component: HeaderOnly;
  let fixture: ComponentFixture<HeaderOnly>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderOnly]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderOnly);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
