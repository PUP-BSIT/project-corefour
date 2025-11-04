import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsCard } from './stats-card';

describe('StatsCard', () => {
  let component: StatsCard;
  let fixture: ComponentFixture<StatsCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
