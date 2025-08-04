import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPinPage } from './login-pin.page';

describe('LoginPinPage', () => {
  let component: LoginPinPage;
  let fixture: ComponentFixture<LoginPinPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPinPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
