export class Wallet {
  id: string = "-";
  name: string = "-";
  network_id: number = 0;
  mnemonic_phrase: string = "-";
  public_key: string = "-";
  private_key: string = "-";
}

export class WalletSigner {
  private_key: string = "-";
}

export class WalletV1Mobile {
  id: number = 0;
  name: string = "";
  mnemonic_phrase: string = "";
  public_key: string = "";
  secret_key: string = "";
  private_key: string = "";
  type: string = "";
  address_type: string = "";
}

export class WalletV1ChromeExtension {

}
