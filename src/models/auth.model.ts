export class Auth {
  encrypted_password: string = "";
  expires_at: number | null = null;
  type: string | 'biometric' | 'pin' | 'password' = 'password';
}

export class PasswordLogin {
  password: string = "";
}

export class PasswordSetup {
  password: string = "";
  confirm_password: string = "";
}
