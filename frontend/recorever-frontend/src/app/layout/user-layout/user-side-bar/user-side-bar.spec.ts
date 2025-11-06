import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSideBar } from './user-side-bar';

describe('UserSideBar', () => {
  let component: UserSideBar;
  let fixture: ComponentFixture<UserSideBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSideBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSideBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
