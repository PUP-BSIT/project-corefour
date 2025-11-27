import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomLocation } from './custom-location';

describe('CustomLocation', () => {
  let component: CustomLocation;
  let fixture: ComponentFixture<CustomLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
