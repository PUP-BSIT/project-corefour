import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserItemListPage } from './user-item-list-page';

describe('UserItemListPage', () => {
  let component: UserItemListPage;
  let fixture: ComponentFixture<UserItemListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserItemListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserItemListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
