import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminItemListPage } from './admin-item-list-page';

describe('AdminItemListPage', () => {
  let component: AdminItemListPage;
  let fixture: ComponentFixture<AdminItemListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItemListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminItemListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
