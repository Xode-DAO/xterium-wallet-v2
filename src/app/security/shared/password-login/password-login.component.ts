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
  IonInput,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

import { EncryptionService } from 'src/app/api/encryption/encryption.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { Auth, PasswordLogin } from 'src/models/auth.model';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-password-login',
  templateUrl: './password-login.component.html',
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
    TranslatePipe,
  ],
  styleUrls: ['./password-login.component.scss'],
})
export class PasswordLoginComponent implements OnInit {
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

  async login() {
    if (!this.passwordLogin.password) {
      const toast = await this.toastController.create({
        message: 'Please enter your password',
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
        message: 'No password found. Please set it up first.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    const decryptedPassword = await this.encryptionService.decrypt(auth.encrypted_password, this.passwordLogin.password);
    if (decryptedPassword !== this.passwordLogin.password) {
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

  ngOnInit() { }
}
