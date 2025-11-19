import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentSummaryPage } from './payment-summary.page';

describe('PaymentSummaryPage', () => {
  let component: PaymentSummaryPage;
  let fixture: ComponentFixture<PaymentSummaryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentSummaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
