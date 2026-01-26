import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
import { WalletAccount, WalletAccountGroup, ConnectedWalletAccounts } from 'src/models/origin-accounts.model';

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { EnvironmentService } from 'src/app/api/environment/environment.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-connected-accounts',
  templateUrl: './connected-accounts.page.html',
  styleUrls: ['./connected-accounts.page.scss'],
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
export class ConnectedAccountsPage implements OnInit {
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

  walletAccountGroups: WalletAccountGroup[] = [];
  checkedWalletAccountGroups: WalletAccountGroup[] = [];

  currentWalletAccountGroup: WalletAccountGroup = new WalletAccountGroup();
  walletAccounts: WalletAccount[] = [];

  connectedWalletAccounts: ConnectedWalletAccounts = new ConnectedWalletAccounts();

  async getWalletAccountGroup(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();

    if (this.wallets.length > 0) {
      for (const wallet of this.wallets) {
        const convertedAddress = await this.encodePublicAddressByDefaultFormat(wallet.public_key)

        const existingAccount = this.walletAccountGroups.find(acc => acc.address === convertedAddress);
        if (!existingAccount) {
          this.walletAccountGroups.push({
            address: await this.encodePublicAddressByDefaultFormat(wallet.public_key),
            wallet_account: {
              name: wallet.name,
              wallet: wallet
            }
          });
        }
      }
    }
  }

  async encodePublicAddressByDefaultFormat(publicKey: string): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = 42;
    return await this.utilsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  toggleCheckbox(accountGroup: WalletAccountGroup, event: any) {
    let isChecked: boolean;

    if (event && event.detail && typeof event.detail.checked !== 'undefined') {
      isChecked = event.detail.checked;
    } else {
      const currentlySelected = this.checkedWalletAccountGroups.some(
        acc => acc.address === accountGroup.address
      );

      isChecked = !currentlySelected;
    }

    if (isChecked) {
      if (!this.checkedWalletAccountGroups.some(acc => acc.address === accountGroup.address)) {
        this.checkedWalletAccountGroups.push(accountGroup);
      }
    } else {
      this.checkedWalletAccountGroups = this.checkedWalletAccountGroups.filter(
        acc => acc.address !== accountGroup.address
      );
    }
  }

  isAccountSelected(accountGroup: WalletAccountGroup): boolean {
    return this.checkedWalletAccountGroups.some(acc => acc.address === accountGroup.address);
  }

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  async openWalletAccountsModal(event: Event, accountGroup: WalletAccountGroup): Promise<void> {
    event.stopPropagation();

    this.walletAccountsModal.present();
    await this.getWalletAccounts(accountGroup);
  }

  async getWalletAccounts(accountGroup: WalletAccountGroup): Promise<void> {
    this.currentWalletAccountGroup = accountGroup;
    this.walletAccounts = [];

    if (this.wallets.length > 0) {
      for (const wallet of this.wallets) {
        const convertedAddress = await this.encodePublicAddressByDefaultFormat(wallet.public_key);
        if (convertedAddress === accountGroup.address) {
          this.walletAccounts.push({
            name: wallet.name,
            wallet: wallet
          });
        }
      }
    }
  }

  selectWalletAccount(walletAccount: WalletAccount): void {
    this.walletAccountsModal.dismiss();
    this.currentWalletAccountGroup.wallet_account = walletAccount;
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

    await this.getWalletAccountGroup();
  }

  async connect(): Promise<void> {
    const connectedWalletAccounts: ConnectedWalletAccounts = new ConnectedWalletAccounts();

    if (this.paramsOrigin) {
      for (const wallet of this.checkedWalletAccountGroups) {
        connectedWalletAccounts.origin = this.paramsOrigin;
        connectedWalletAccounts.approved = true;
        connectedWalletAccounts.wallet_accounts.push(wallet.wallet_account);
      }
    } else {
      const toast = await this.toastController.create({
        message: 'No origin provided.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    if (this.environmentService.isChromeExtension()) {
      chrome.runtime.sendMessage(
        {
          method: "connection-approval",
          payload: {
            origin: this.paramsOrigin,
            selected_accounts: connectedWalletAccounts,
            approved: true,
          },
        },
        (response) => {
          console.log('Approval response sent', response);
        }
      );
    } else {
      if (this.paramsCallbackUrl && this.paramsCallbackUrl !== null) {
        this.router.navigate(['/xterium/balances']);

        const finalUrl = `${this.paramsCallbackUrl}?selectedAccounts=${encodeURIComponent(JSON.stringify(connectedWalletAccounts.wallet_accounts))}`;
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
    this.router.navigate(['/xterium/balances']);
  }

  ngOnInit() {
    this.initConnection();
  }
}
