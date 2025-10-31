import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonToast,
} from '@ionic/angular/standalone';

import { HeaderComponent } from 'src/app/security/shared/header/header.component';
import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { BiometricComponent } from 'src/app/security/shared/biometric/biometric.component';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonToast,
    HeaderComponent,
    PasswordSetupComponent,
    PasswordLoginComponent,
    BiometricComponent
  ]
})
export class LoginPage implements OnInit {

  constructor(
    private environmentService: EnvironmentService,
    private authService: AuthService,
  ) { }

  isChromeExtension = false;
  isPasswordExisting = false;

  async initSecurity() {
    const auth = await this.authService.getAuth();
    if (auth) {
      this.isPasswordExisting = true;
    }
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();
  }
}
