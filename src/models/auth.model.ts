export class Auth {
  encrypted_password: string = "";
  timestamp: number = 0;
}

export class PasswordLogin {
  password: string = "";
}

export class PasswordSetup {
  password: string = "";
  confirm_password: string = "";
}
