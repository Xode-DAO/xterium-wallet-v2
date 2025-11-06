import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectPayPage } from './select-pay.page';

describe('SelectPayPage', () => {
  let component: SelectPayPage;
  let fixture: ComponentFixture<SelectPayPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
