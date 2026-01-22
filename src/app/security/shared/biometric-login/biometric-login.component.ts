import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { fingerPrint, shieldCheckmark } from 'ionicons/icons';

import { BiometricService } from 'src/app/api/biometric/biometric.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-biometric-login',
  templateUrl: './biometric-login.component.html',
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    TranslatePipe,
  ],
  styleUrls: ['./biometric-login.component.scss'],
})
export class BiometricLoginComponent implements OnInit {
  @Output() onLogin = new EventEmitter<string>();

  constructor(
    private biometricService: BiometricService,
    private encryptionService: EncryptionService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      fingerPrint,
      shieldCheckmark
    });
  }

  isBiometricAvailable = false;
  isProcessing = false;

  async initBiometric() {
    const availability = await this.biometricService.isAvailable();
    this.isBiometricAvailable = availability.available;
  }

  async login() {
    this.isProcessing = true;

    const auth = await this.authService.getAuth();

    if (!auth?.encrypted_password) {
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: 'No password found. Please set it up first.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    const success = await this.biometricService.verifyIdentity();
    if (!success) {
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: 'Biometric authentication failed.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    const credentials = await this.biometricService.getCredentials();

    const decryptedPassword = await this.encryptionService.decrypt(auth.encrypted_password, credentials.password);
    if (decryptedPassword !== credentials.password) {
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: 'Invalid password. Try again.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    await this.authService.renewAuth();

    this.onLogin.emit(decryptedPassword);
    this.isProcessing = false;
  }

  ngOnInit() {
    this.initBiometric();
  }
}
