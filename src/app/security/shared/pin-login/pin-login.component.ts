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
  IonInputOtp,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { Auth, PasswordLogin } from 'src/models/auth.model';

@Component({
  selector: 'app-pin-login',
  templateUrl: './pin-login.component.html',
  styleUrls: ['./pin-login.component.scss'],
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
    IonInputOtp,
  ],
})
export class PinLoginComponent implements OnInit {
  @Output() onLogin = new EventEmitter<string>();

  constructor(
    private encryptionService: EncryptionService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      shieldCheckmark
    });
  }

  passwordLogin = new PasswordLogin();
  isProcessing = false;

  maskPin(event: any) {
    const inputs = document.querySelectorAll<HTMLInputElement>('#otpInput input');
    inputs.forEach((input) => {
      input.type = 'password';
    });
  }

  async login() {
    if (!this.passwordLogin.password) {
      const toast = await this.toastController.create({
        message: 'Please enter your pin',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.isProcessing = true;

    const auth = await this.authService.getAuth();

    if (!auth?.encrypted_password) {
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: 'No pin found. Please set it up first.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    const decryptedPin = await this.encryptionService.decrypt(auth.encrypted_password, this.passwordLogin.password);
    if (decryptedPin !== this.passwordLogin.password) {
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: 'Invalid pin. Try again.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    await this.authService.renewAuth();

    this.onLogin.emit(decryptedPin);
    this.isProcessing = false;
  }

  onPinChange(event: any) {
    this.passwordLogin.password = event.detail.value;
  }

  ngOnInit() { }
}
