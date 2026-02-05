import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { encodeAddress } from '@polkadot/util-crypto';

import {
  IonContent,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCheckbox,
  IonChip,
  IonIcon,
  IonModal,
  IonAvatar,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonToast,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  globeOutline,
  close,
  chevronDownOutline
} from 'ionicons/icons';

import { Wallet } from 'src/models/wallet.model';
import { WalletAccount, WrappedWalletAccount, Web3WalletAccounts } from 'src/models/web3-accounts.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-connect-accounts',
  templateUrl: './connect-accounts.page.html',
  styleUrls: ['./connect-accounts.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCheckbox,
    IonChip,
    IonIcon,
    IonModal,
    IonAvatar,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonToast,
    TranslatePipe
  ]
})
export class ConnectAccountsPage implements OnInit {
  @ViewChild('walletAccountsModal', { read: IonModal }) walletAccountsModal!: IonModal;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utilsService: UtilsService,
    private environmentService: EnvironmentService,
    private walletsService: WalletsService,
    private toastController: ToastController
  ) {
    addIcons({ close, chevronDownOutline, globeOutline });
  }

  paramsOrigin: string | null = null;
  paramsCallbackUrl: string | null = null;

  wallets: Wallet[] = [];

  wrappedWalletAccounts: WrappedWalletAccount[] = [];
  checkedWrappedWalletAccounts: WrappedWalletAccount[] = [];

  currentWrappedWalletAccount: WrappedWalletAccount = new WrappedWalletAccount();
  walletAccounts: WalletAccount[] = [];

  web3WalletAccounts: Web3WalletAccounts = new Web3WalletAccounts();

  async getWrappedWalletAccount(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();

    if (this.wallets.length > 0) {
      for (const wallet of this.wallets) {
        const convertedAddress = await this.encodePublicAddressByDefaultFormat(wallet.public_key)

        const existingAccount = this.wrappedWalletAccounts.find(acc => acc.wallet_account.address === convertedAddress);
        if (!existingAccount) {

          let isChecked = false;
          if (this.environmentService.isChromeExtension()) {
            isChecked = await this.isWeb3AccountConnected(convertedAddress);
          }

          this.wrappedWalletAccounts.push({
            checked: isChecked,
            ss58Format: Number(wallet.chain?.address_prefix) || 42,
            wallet_account: {
              address: convertedAddress,
              name: wallet.name,
              wallet: wallet
            }
          });

          if (isChecked) {
            this.checkedWrappedWalletAccounts.push({
              checked: isChecked,
              ss58Format: Number(wallet.chain?.address_prefix) || 42,
              wallet_account: {
                address: convertedAddress,
                name: wallet.name,
                wallet: wallet
              }
            });
          }
        }
      }
    }
  }

  async isWeb3AccountConnected(address: string): Promise<boolean> {
    const result: any = await chrome.storage.local.get(["web3_accounts"]);
    const web3Accounts = result.web3_accounts || [];

    console.log("Web3 Accounts from storage:", web3Accounts);

    const existingConnection = web3Accounts.find((o: any) =>
      o.origin === this.paramsOrigin && o.wallet_accounts.some((wa: any) => wa.address === address)
    );
    if (existingConnection) {
      return true;
    }

    return false;
  }

  async encodePublicAddressByDefaultFormat(publicKey: string): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = 42;
    return await this.utilsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  encodePublicAddressByChainFormat(publicKey: string, ss58Format: number): string {
    return encodeAddress(publicKey, ss58Format);
  }

  toggleCheckbox(wrappedAccount: WrappedWalletAccount, event: any) {
    let isChecked: boolean;

    if (event && event.detail && typeof event.detail.checked !== 'undefined') {
      isChecked = event.detail.checked;
      wrappedAccount.checked = isChecked;
    } else {
      const currentlySelected = this.checkedWrappedWalletAccounts.some(
        acc => acc.wallet_account.address === wrappedAccount.wallet_account.address
      );

      isChecked = !currentlySelected;
      wrappedAccount.checked = isChecked;
    }

    if (isChecked) {
      if (!this.checkedWrappedWalletAccounts.some(acc => acc.wallet_account.address === wrappedAccount.wallet_account.address)) {
        this.checkedWrappedWalletAccounts.push(wrappedAccount);
      }
    } else {
      this.checkedWrappedWalletAccounts = this.checkedWrappedWalletAccounts.filter(
        acc => acc.wallet_account.address !== wrappedAccount.wallet_account.address
      );
    }
  }

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  async openWalletAccountsModal(event: Event, wrappedAccount: WrappedWalletAccount): Promise<void> {
    event.stopPropagation();

    this.walletAccountsModal.present();
    await this.getWalletAccounts(wrappedAccount);
  }

  async getWalletAccounts(wrappedAccount: WrappedWalletAccount): Promise<void> {
    this.currentWrappedWalletAccount = wrappedAccount;
    this.walletAccounts = [];

    if (this.wallets.length > 0) {
      for (const wallet of this.wallets) {
        const convertedAddress = await this.encodePublicAddressByDefaultFormat(wallet.public_key);
        if (convertedAddress === wrappedAccount.wallet_account.address) {
          this.walletAccounts.push({
            address: convertedAddress,
            name: wallet.name,
            wallet: wallet
          });
        }
      }
    }
  }

  selectWalletAccount(walletAccount: WalletAccount): void {
    this.walletAccountsModal.dismiss();

    const ss58Format = Number(walletAccount.wallet?.chain?.address_prefix);

    walletAccount.address = this.encodePublicAddressByChainFormat(this.currentWrappedWalletAccount.wallet_account.address, ss58Format);;

    this.currentWrappedWalletAccount.ss58Format = ss58Format;
    this.currentWrappedWalletAccount.wallet_account.address = walletAccount.address;
    this.currentWrappedWalletAccount.wallet_account = walletAccount;

    const wrappedAccount = this.wrappedWalletAccounts.find(acc => acc.wallet_account.address === this.currentWrappedWalletAccount.wallet_account.address);
    if (wrappedAccount) {
      wrappedAccount.ss58Format = ss58Format;
      wrappedAccount.wallet_account = walletAccount;
    }

    const checkedWrappedAccount = this.checkedWrappedWalletAccounts.find(acc => acc.wallet_account.address === this.currentWrappedWalletAccount.wallet_account.address);
    if (checkedWrappedAccount) {
      checkedWrappedAccount.ss58Format = ss58Format;
      checkedWrappedAccount.wallet_account = walletAccount;
    }
  }

  async initConnection(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      if (params['origin']) {
        this.paramsOrigin = decodeURIComponent(params['origin']);
      }

      if (params['callbackUrl']) {
        this.paramsCallbackUrl = decodeURIComponent(params['callbackUrl']);
      }
    });

    await this.getWrappedWalletAccount();
  }

  async connect(): Promise<void> {
    const web3WalletAccounts: Web3WalletAccounts = new Web3WalletAccounts();

    if (this.paramsOrigin) {
      for (const wallet of this.checkedWrappedWalletAccounts) {
        web3WalletAccounts.origin = this.paramsOrigin;

        wallet.wallet_account.address = this.encodePublicAddressByChainFormat(
          wallet.wallet_account.address,
          wallet.ss58Format
        );

        web3WalletAccounts.wallet_accounts.push(wallet.wallet_account);
      }
    } else {
      const toast = await this.toastController.create({
        message: 'No origin or origin URL provided.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    if (this.environmentService.isChromeExtension()) {
      let originsResult: any = await chrome.storage.local.get(["origins"]);
      const origins = originsResult.origins || [];

      const existingOrigin = origins.find((o: any) => o.origin === this.paramsOrigin);
      if (!existingOrigin) {
        const toast = await this.toastController.create({
          message: 'Origin not found in storage.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      chrome.runtime.sendMessage(
        {
          method: "connect-web3-accounts",
          payload: web3WalletAccounts,
        },
        (response) => {
          console.log('Connection response sent', response);
        }
      );

      this.router.navigate(['/xterium/balances']);
    } else {
      if (this.paramsCallbackUrl && this.paramsCallbackUrl !== null) {
        this.router.navigate(['/xterium/balances']);

        const finalUrl = `${this.paramsCallbackUrl}?selectedAccounts=${encodeURIComponent(JSON.stringify(web3WalletAccounts.wallet_accounts))}`;
        window.open(finalUrl, '_blank');
      } else {
        const toast = await this.toastController.create({
          message: 'No callback URL provided.',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }
    }
  }

  reject(): void {
    if (this.environmentService.isChromeExtension()) {
      chrome.runtime.sendMessage(
        {
          method: "reject-connection"
        },
        (response) => {
          console.log('Rejection response sent', response);
        }
      );
    }

    this.router.navigate(['/xterium/balances']);
  }

  ngOnInit() {
    this.initConnection();
  }
}
