import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectChainPage } from './select-chain.page';

describe('SelectChainPage', () => {
  let component: SelectChainPage;
  let fixture: ComponentFixture<SelectChainPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectChainPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
