import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectQrPayPage } from './select-qr-pay.page';

describe('SelectQrPayPage', () => {
  let component: SelectQrPayPage;
  let fixture: ComponentFixture<SelectQrPayPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectQrPayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
