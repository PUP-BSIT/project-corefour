import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemDetailModal } from './item-detail-modal';

describe('ItemDetailModal', () => {
  let component: ItemDetailModal;
  let fixture: ComponentFixture<ItemDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
