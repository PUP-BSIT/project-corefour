import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLayout } from './user-layout';

describe('UserLayout', () => {
  let component: UserLayout;
  let fixture: ComponentFixture<UserLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
