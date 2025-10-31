import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-biometric',
  templateUrl: './biometric.component.html',
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
  ],
  styleUrls: ['./biometric.component.scss'],
})
export class BiometricComponent implements OnInit {

  constructor(
    private router: Router,
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

    if (!this.isBiometricAvailable) {
      const toast = await this.toastController.create({
        message: 'Biometric not available on this device.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    const isBiometricEnabled = await this.biometricService.isBiometricEnabled();
    if (!isBiometricEnabled) {
      this.biometricService.enableBiometric();

      await this.biometricService.setCredentials();
      const credentials = await this.biometricService.getCredentials();

      const encryptedPassword = await this.encryptionService.encrypt(credentials.password, credentials.password);
      await this.authService.setupPassword(encryptedPassword);

      const toast = await this.toastController.create({
        message: 'Biometric setup complete! Please login again.',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }
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

    const toast = await this.toastController.create({
      message: 'Biometric login successful!',
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();

    this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  ngOnInit() {
    this.initBiometric();
  }
}
