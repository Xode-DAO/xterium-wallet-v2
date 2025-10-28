import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { BiometricService } from 'src/app/api/biometric/biometric.service';
import { StorageService } from 'src/app/api/storage/storage.service';
import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import * as CryptoJS from 'crypto-js';
import { addIcons } from 'ionicons';
import { fingerPrint, shieldCheckmark } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
  ],
})
export class LoginPage implements OnInit {
  isMobile = false;
  biometricAvailable = false;
  biometricType = 'unknown';
  password = '';
  confirmPassword = '';
  isLoading = false;
  isFirstTimeSetup = false;

  constructor(
    private platform: Platform,
    private biometricService: BiometricService,
    private storageService: StorageService,
    private router: Router,
    private encryptionService: EncryptionService,
    private ngZone: NgZone,
    private toastController: ToastController
  ) {
    addIcons({ fingerPrint, shieldCheckmark });
  }

  async ngOnInit() {
    this.detectPlatform();
    if (this.isMobile) {
      await this.setupOrLoginBiometric();
    } else {
      await this.checkExistingPassword();
    }
  }

  private detectPlatform() {
    this.isMobile =
      this.platform.is('mobile') ||
      this.platform.is('android') ||
      this.platform.is('ios') ||
      this.platform.is('capacitor');
  }

  private async setupOrLoginBiometric() {
    try {
      const availability = await this.biometricService.isBiometricAvailable();
      this.biometricAvailable = availability.available;
      this.biometricType = availability.type || 'unknown';

      if (!this.biometricAvailable) {
        return this.showToast('Biometric not available on this device.', 'danger');
      }

      const hasBioSetup = await this.storageService.get('biometricEnabled');

      if (!hasBioSetup) {
        const bioKey = await this.biometricService.generateBiometricKey();
        await this.storageService.set('biometricEnabled', 'true');
        await this.storageService.set('bioKey', bioKey);
        await this.showToast('Biometric setup complete!', 'success');
        await this.performLogin();
      } else {
        await this.loginWithBiometric();
      }
    } catch (error) {
      console.error('Biometric setup/login error:', error);
      await this.showToast('Biometric setup failed.', 'danger');
    }
  }

  async loginWithBiometric() {
    this.isLoading = true;
    try {
      const success = await this.biometricService.verifyIdentity();
      if (!success) {
        return this.showToast('Authentication failed. Try again.', 'danger');
      }

      await this.performLogin();
      await this.showToast('Biometric login successful!', 'success');
    } catch (error) {
      console.error('Biometric login error:', error);
      await this.showToast('Error during authentication.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async checkExistingPassword() {
    try {
      const storedPassword = await this.storageService.get('userPassword');
      this.isFirstTimeSetup = !storedPassword;
    } catch {
      this.isFirstTimeSetup = true;
    }
  }

  async loginWithPassword() {
    if (this.isFirstTimeSetup) {
      await this.setupExtensionPassword();
    } else {
      await this.verifyExtensionPassword();
    }
  }

  private async setupExtensionPassword() {
    if (!this.password) {
      return this.showToast('Please enter a password', 'warning');
    }
    if (this.password.length < 6) {
      return this.showToast('Password must be at least 6 characters long', 'warning');
    }
    if (this.password !== this.confirmPassword) {
      return this.showToast('Passwords do not match', 'warning');
    }

    try {
      const encryptedPassword = CryptoJS.AES.encrypt(this.password, this.password).toString();
      await this.storageService.set('userPassword', encryptedPassword);
      await this.performLogin();
      await this.showToast('Password setup successful!', 'success');
    } catch {
      await this.showToast('Failed to set up password. Please try again.', 'danger');
    } finally {
      this.password = '';
      this.confirmPassword = '';
    }
  }

  private async verifyExtensionPassword() {
    if (!this.password) {
      return this.showToast('Please enter your password', 'warning');
    }

    try {
      const storedEncrypted = await this.storageService.get('userPassword');
      if (!storedEncrypted) {
        return this.showToast('No password found. Please set it up first.', 'warning');
      }

      const decrypted = CryptoJS.AES.decrypt(storedEncrypted, this.password).toString(CryptoJS.enc.Utf8);
      if (decrypted !== this.password) {
        return this.showToast('Invalid password. Try again.', 'danger');
      }

      await this.performLogin();
      await this.showToast('Login successful!', 'success');
    } catch {
      await this.showToast('An error occurred during login. Please try again.', 'danger');
    } finally {
      this.password = '';
    }
  }

  private async performLogin() {
    await this.ngZone.run(async () => {
      await this.router.navigate(['/xterium'], { replaceUrl: true });
    });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 1500,
      position: 'top',
    });
    await toast.present();
  }
}
