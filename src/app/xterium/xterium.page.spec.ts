import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XteriumPage } from './xterium.page';

describe('XteriumPage', () => {
  let component: XteriumPage;
  let fixture: ComponentFixture<XteriumPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(XteriumPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
