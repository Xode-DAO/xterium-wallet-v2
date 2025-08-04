import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewWalletPage } from './create-new-wallet.page';

describe('CreateNewWalletPage', () => {
  let component: CreateNewWalletPage;
  let fixture: ComponentFixture<CreateNewWalletPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewWalletPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
