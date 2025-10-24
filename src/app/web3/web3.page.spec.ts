import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Web3Page } from './web3.page';

describe('Web3Page', () => {
  let component: Web3Page;
  let fixture: ComponentFixture<Web3Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Web3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
