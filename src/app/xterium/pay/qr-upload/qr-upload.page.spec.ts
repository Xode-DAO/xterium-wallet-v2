import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrUploadPage } from './qr-upload.page';

describe('QrUploadPage', () => {
  let component: QrUploadPage;
  let fixture: ComponentFixture<QrUploadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrUploadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
