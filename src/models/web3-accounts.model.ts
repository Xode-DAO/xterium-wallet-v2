import { Wallet } from "./wallet.model";

export class WalletAccount {
  address: string = "";
  name: string = "";
  wallet: Wallet | null = null;
}

export class WrappedWalletAccount {
  checked: boolean = false;
  ss58Format: number = 42;
  wallet_account: WalletAccount = new WalletAccount();
}

export class Web3WalletAccounts {
  origin: string = "";
  wallet_accounts: WalletAccount[] = [];
}
