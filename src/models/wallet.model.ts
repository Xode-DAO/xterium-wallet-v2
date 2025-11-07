import { Chain } from "src/models/chain.model";

export class Wallet {
  id: string = "-";
  name: string = "-";
  chain: Chain = new Chain();
  mnemonic_phrase: string = "-";
  public_key: string = "-";
  private_key: string = "-";
}

export class WalletSigner {
  public_key: string = "";
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
