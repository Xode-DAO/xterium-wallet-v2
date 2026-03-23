import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonButton,
  IonLabel,
  IonInputOtp,
  ToastController,
  IonSpinner
} from '@ionic/angular/standalone';

import { TranslatePipe } from '@ngx-translate/core';
import { WalletBackupService } from 'src/app/api/wallet-backup/wallet-backup.service';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonButton,
    IonLabel,
    IonSpinner,
    IonInputOtp,
    TranslatePipe,
  ],
})
export class BackupComponent implements OnInit {
  @Output() onBackupComplete = new EventEmitter<boolean>();
  @Output() onProcessingChange = new EventEmitter<boolean>();

  constructor(
    private walletBackupService: WalletBackupService,
    private toastController: ToastController
  ) { }

  pinSetup: string = '';
  confirmPinSetup: string = '';
  isProcessing = false;

  maskPin(event: any) {
    const inputs = document.querySelectorAll<HTMLInputElement>('#otpInput input');
    inputs.forEach((input) => {
      input.type = 'password';
    });
  }

  async setupPin() {
    if (!this.pinSetup) {
      const toast = await this.toastController.create({
        message: 'Please enter a PIN.',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });
      await toast.present();
      return;
    }

    if (this.pinSetup !== this.confirmPinSetup) {
      const toast = await this.toastController.create({
        message: 'PINs do not match.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });
      await toast.present();
      return;
    }

    if (this.pinSetup.length < 6) {
      const toast = await this.toastController.create({
        message: 'PIN must be 6 digits.',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });
      await toast.present();
      return;
    }

    this.onBackupComplete.emit(true);
    this.isProcessing = true;
    this.onProcessingChange.emit(true);

    const result = await this.walletBackupService.backup(this.pinSetup);

    this.pinSetup = '';
    this.confirmPinSetup = '';

    const toast = await this.toastController.create({
      message: result.success
        ? 'Backup successful! Wallets saved to Google Drive.'
        : `Backup failed: ${result.error}`,
      color: result.success ? 'success' : 'danger',
      duration: 2500,
      position: 'top',
    });
    await toast.present();

    this.isProcessing = false;
    this.onProcessingChange.emit(false);
  }

  onPinSetup(event: any) {
    this.pinSetup = event.detail.value;
  }

  onConfirmPinSetup(event: any) {
    this.confirmPinSetup = event.detail.value;
  }

  ngOnInit() { }

}
