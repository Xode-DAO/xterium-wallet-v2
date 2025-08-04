import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportOptionsPage } from './import-options.page';

describe('ImportOptionsPage', () => {
  let component: ImportOptionsPage;
  let fixture: ComponentFixture<ImportOptionsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportOptionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
