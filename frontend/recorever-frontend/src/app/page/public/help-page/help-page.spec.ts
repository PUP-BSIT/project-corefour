import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpPage } from './help-page';

describe('HelpPage', () => {
  let component: HelpPage;
  let fixture: ComponentFixture<HelpPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
