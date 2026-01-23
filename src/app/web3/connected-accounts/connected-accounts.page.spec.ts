import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectedAccountsPage } from './connected-accounts.page';

describe('ConnectedAccountsPage', () => {
  let component: ConnectedAccountsPage;
  let fixture: ComponentFixture<ConnectedAccountsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectedAccountsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
