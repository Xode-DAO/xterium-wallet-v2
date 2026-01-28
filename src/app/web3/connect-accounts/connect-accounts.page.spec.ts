import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectAccountsPage } from './connect-accounts.page';

describe('ConnectAccountsPage', () => {
  let component: ConnectAccountsPage;
  let fixture: ComponentFixture<ConnectAccountsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectAccountsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
