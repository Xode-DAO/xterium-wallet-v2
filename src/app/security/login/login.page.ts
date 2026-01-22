import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
} from '@ionic/angular/standalone';

import { HeaderComponent } from 'src/app/security/shared/header/header.component';
import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { PinSetupComponent } from 'src/app/security/shared/pin-setup/pin-setup.component';
import { PinLoginComponent } from 'src/app/security/shared/pin-login/pin-login.component';
import { BiometricLoginComponent } from 'src/app/security/shared/biometric-login/biometric-login.component';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';
import { BiometricService } from 'src/app/api/biometric/biometric.service';

import { Auth } from 'src/models/auth.model';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonToast,
    HeaderComponent,
    PasswordSetupComponent,
    PasswordLoginComponent,
    PinSetupComponent,
    PinLoginComponent,
    TranslatePipe,
    BiometricLoginComponent
  ]
})
export class LoginPage implements OnInit {

  constructor(
    private router: Router,
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private biometricService: BiometricService,
  ) { }

  isChromeExtension = false;

  currentAuth: Auth | null = null;
  isBiometricAvailable = false;

  async initSecurity() {
    const auth = await this.authService.getAuth();
    if (auth) {
      this.currentAuth = auth;
    }

    const availability = await this.biometricService.isAvailable();
    this.isBiometricAvailable = availability.available;
  }

  goToXteriumPage(_: string) {
    this.router.navigate(['/xterium'], { replaceUrl: true });
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();
  }
}
