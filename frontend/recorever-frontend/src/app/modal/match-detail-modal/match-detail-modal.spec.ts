import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchDetailModal } from './match-detail-modal';

describe('MatchDetailModal', () => {
  let component: MatchDetailModal;
  let fixture: ComponentFixture<MatchDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
