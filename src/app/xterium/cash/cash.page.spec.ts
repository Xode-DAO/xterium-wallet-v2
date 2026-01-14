import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CashPage } from './cash.page';

describe('CashPage', () => {
  let component: CashPage;
  let fixture: ComponentFixture<CashPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
