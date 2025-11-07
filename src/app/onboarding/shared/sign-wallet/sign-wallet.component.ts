import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { AuthService } from 'src/app/api/auth/auth.service';

import { PasswordSetupComponent } from 'src/app/security/shared/password-setup/password-setup.component';
import { PasswordLoginComponent } from 'src/app/security/shared/password-login/password-login.component';
import { BiometricComponent } from 'src/app/security/shared/biometric/biometric.component';

@Component({
  selector: 'app-sign-wallet',
  templateUrl: './sign-wallet.component.html',
  imports: [
    PasswordSetupComponent,
    PasswordLoginComponent,
    BiometricComponent
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
  isPasswordExisting = false;

  async initSecurity() {
    const auth = await this.authService.getAuth();
    if (auth) {
      this.isPasswordExisting = true;
    }
  }

  async signWallet(password: string) {
    this.onSignWallet.emit(password);
  }

  ngOnInit() {
    this.isChromeExtension = this.environmentService.isChromeExtension();
    this.initSecurity();
  }
}
