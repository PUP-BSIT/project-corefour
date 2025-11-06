import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderNFooterOnly } from './header-nfooter-only';

describe('HeaderNFooterOnly', () => {
  let component: HeaderNFooterOnly;
  let fixture: ComponentFixture<HeaderNFooterOnly>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderNFooterOnly]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderNFooterOnly);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
