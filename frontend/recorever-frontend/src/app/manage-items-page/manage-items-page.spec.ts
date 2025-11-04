import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageItemsPage } from './manage-items-page';

describe('ManageItemsPage', () => {
  let component: ManageItemsPage;
  let fixture: ComponentFixture<ManageItemsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageItemsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageItemsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
