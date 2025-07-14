import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestedComponent } from './invested.component';

describe('InvestedComponent', () => {
  let component: InvestedComponent;
  let fixture: ComponentFixture<InvestedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
