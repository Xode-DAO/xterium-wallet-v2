import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { Auth } from 'src/models/auth.model';

import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { PinSetupComponent } from 'src/app/security/shared/pin-setup/pin-setup.component';
import { PinLoginComponent } from 'src/app/security/shared/pin-login/pin-login.component';
import { BiometricLoginComponent } from 'src/app/security/shared/biometric-login/biometric-login.component';

@Component({
  selector: 'app-sign-wallet',
  templateUrl: './sign-wallet.component.html',
  imports: [
    PasswordSetupComponent,
    PasswordLoginComponent,
    PinSetupComponent,
    PinLoginComponent,
    BiometricLoginComponent,
  ],
  styleUrls: ['./sign-wallet.component.scss'],
})
export class SignWalletComponent implements OnInit {
  @Output() onSignWallet = new EventEmitter<string>();

  constructor(
    private environmentService: EnvironmentService,
    private authService: AuthService,
  ) { }

  isChromeExtension = false;

  currentAuth: Auth | null = null;

  async initSecurity() {
    this.currentAuth = await this.authService.getAuth();
  }

  async signWallet(password: string) {
    this.onSignWallet.emit(password);
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();
  }
}
