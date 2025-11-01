import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
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
  IonInput,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { PasswordSetup } from 'src/models/auth.model';

@Component({
  selector: 'app-password-setup',
  templateUrl: './password-setup.component.html',
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonButton,
    IonInput,
    IonIcon,
  ],
  styleUrls: ['./password-setup.component.scss'],
})
export class PasswordSetupComponent implements OnInit {
  @Output() onPasswordSetup = new EventEmitter<string>();

  constructor(
    private router: Router,
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
        message: 'Password must be at least 6 characters long',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    if (this.passwordSetup.password !== this.passwordSetup.confirm_password) {
      const toast = await this.toastController.create({
        message: 'Passwords do not match',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.isProcessing = true;

    const encryptedPassword = await this.encryptionService.encrypt(this.passwordSetup.password, this.passwordSetup.password);
    await this.authService.setupPassword(encryptedPassword);

    this.onPasswordSetup.emit(this.passwordSetup.password);

    const toast = await this.toastController.create({
      message: 'Password setup successful!',
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();

    this.router.navigate(['/onboarding'], { replaceUrl: true });
    this.isProcessing = false;
  }

  ngOnInit() { }
}
