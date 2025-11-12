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
  IonIcon,
  IonLabel,
  IonInputOtp,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { PasswordSetup } from 'src/models/auth.model';

@Component({
  selector: 'app-pin-setup',
  templateUrl: './pin-setup.component.html',
  styleUrls: ['./pin-setup.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonButton,
    IonIcon,
    IonLabel,
    IonInputOtp,
  ],
})
export class PinSetupComponent implements OnInit {
  @Output() onPasswordSetup = new EventEmitter<string>();

  constructor(
    private encryptionService: EncryptionService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      shieldCheckmark
    });
  }

  passwordSetup = new PasswordSetup();
  isProcessing = false;

  maskPin(event: any) {
    const inputs = document.querySelectorAll<HTMLInputElement>('#otpInput input');
    inputs.forEach((input) => {
      input.type = 'password';
    });
  }

  async setupPassword() {
    if (!this.passwordSetup.password) {
      const toast = await this.toastController.create({
        message: 'Please enter a password',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    if (this.passwordSetup.password.length < 6) {
      const toast = await this.toastController.create({
        message: 'Pin must be at least 6 characters long',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    if (this.passwordSetup.password !== this.passwordSetup.confirm_password) {
      const toast = await this.toastController.create({
        message: 'Pins do not match',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.isProcessing = true;

    const encryptedPassword = await this.encryptionService.encrypt(this.passwordSetup.password, this.passwordSetup.password);
    await this.authService.setupPassword(encryptedPassword, 'pin');

    this.onPasswordSetup.emit(this.passwordSetup.password);
    this.isProcessing = false;
  }

  onPinChange(event: any) {
    this.passwordSetup.password = event.detail.value;
  }

  onConfirmPinChange(event: any) {
    this.passwordSetup.confirm_password = event.detail.value;
  }

  ngOnInit() { }
}
