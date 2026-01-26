import { Wallet } from "./wallet.model";

export class WalletAccount {
  name: string = "";
  wallet: Wallet | null = null;
}

export class WalletAccountGroup {
  address: string = "";
  wallet_account: WalletAccount = new WalletAccount();
}

export class ConnectedWalletAccounts {
  origin: string = "";
  approved: boolean = false;
  wallet_accounts: WalletAccount[] = [];
}
