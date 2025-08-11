import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectNetworkPage } from './select-network.page';

describe('SelectNetworkPage', () => {
  let component: SelectNetworkPage;
  let fixture: ComponentFixture<SelectNetworkPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectNetworkPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
