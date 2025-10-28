import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserPage } from './browser.page';

describe('BrowserPage', () => {
  let component: BrowserPage;
  let fixture: ComponentFixture<BrowserPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
