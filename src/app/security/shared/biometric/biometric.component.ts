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
    private toastController: ToastController
  ) {
    addIcons({
      fingerPrint,
      shieldCheckmark
    });
  }

  isBiometricAvailable = false;
  isProcessing = false;

  private async initBiometric() {
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
    }

    const isBiometricEnabled = await this.biometricService.isBiometricEnabled();
    if (!isBiometricEnabled) {
      await this.biometricService.setCredentials();
      this.biometricService.enableBiometric();

      const toast = await this.toastController.create({
        message: 'Biometric setup complete! Please login again.',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else {
      await this.login();
    }
  }

  async login() {
    this.isProcessing = true;

    try {
      const success = await this.biometricService.verifyIdentity();
      if (!success) {
        const toast = await this.toastController.create({
          message: 'Biometric authentication failed.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      }

      const toast = await this.toastController.create({
        message: 'Biometric login successful!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error during authentication. Error: ' + error,
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } finally {
      this.router.navigate(['/xterium'], { replaceUrl: true });
      this.isProcessing = false;
    }
  }

  ngOnInit() {
    this.initBiometric();
  }
}
