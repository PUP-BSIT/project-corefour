import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSideBar } from './admin-side-bar';

describe('AdminSideBar', () => {
  let component: AdminSideBar;
  let fixture: ComponentFixture<AdminSideBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSideBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSideBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
