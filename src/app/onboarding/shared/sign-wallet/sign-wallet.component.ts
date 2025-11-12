import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';
import { BiometricService } from 'src/app/api/biometric/biometric.service';

import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { PinSetupComponent } from 'src/app/security/shared/pin-setup/pin-setup.component';
import { PinLoginComponent } from 'src/app/security/shared/pin-login/pin-login.component';
import { BiometricComponent } from 'src/app/security/shared/biometric/biometric.component';

@Component({
  selector: 'app-sign-wallet',
  templateUrl: './sign-wallet.component.html',
  imports: [
    PasswordSetupComponent,
    PasswordLoginComponent,
    PinSetupComponent,
    PinLoginComponent,
    BiometricComponent
  ],
  styleUrls: ['./sign-wallet.component.scss'],
})
export class SignWalletComponent implements OnInit {
  @Output() onSignWallet = new EventEmitter<string>();

  constructor(
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private biometricService: BiometricService,
  ) { }

  isChromeExtension = false;
  isPasswordExisting = false;
  isBiometricAvailable = false;

  async initSecurity() {
    const auth = await this.authService.getAuth();
    if (auth) {
      this.isPasswordExisting = true;
    }

    const availability = await this.biometricService.isAvailable();
    this.isBiometricAvailable = availability.available;
  }

  async signWallet(password: string) {
    this.onSignWallet.emit(password);
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();
  }
}
