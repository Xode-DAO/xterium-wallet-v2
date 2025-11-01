import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignTransactionPage } from './sign-transaction.page';

describe('SignTransactionPage', () => {
  let component: SignTransactionPage;
  let fixture: ComponentFixture<SignTransactionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SignTransactionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
