import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetupWalletPage } from './setup-wallet.page';

describe('SetupWalletPage', () => {
  let component: SetupWalletPage;
  let fixture: ComponentFixture<SetupWalletPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupWalletPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
