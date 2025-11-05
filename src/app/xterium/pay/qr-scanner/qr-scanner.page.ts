import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';

import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.page.html',
  styleUrls: ['./qr-scanner.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonText,
  ],
})
export class QrScannerPage implements OnInit {
  qrAmount: number | null = null;

  walletData: {
    name?: string;
    account?: string;
    amount?: number;
  } = {};

  availableUSDt: number = 0;

  selectedChain: Chain = {} as Chain;
  currentWallet: Wallet = {} as Wallet;

  currentWalletPublicAddress: string = '';

  scannedResult: string | null = null;
  scanning = false;
  scanSuccess = false;
  parsedEMV: any = null;

  tokenDetails = {
    token: 'USDt',
    amount: 9.969981,
    pricePerToken: 1.003011,
  };

  constructor(
    private router: Router,
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService
  ) {
    addIcons({
      arrowBackOutline,
      close,
    });
  }

  formatEMVQR(data: string) {
    const parsed: any = {};
    let i = 0;

    while (i < data.length) {
      const tag = data.substring(i, i + 2);
      const len = parseInt(data.substring(i + 2, i + 4), 10);
      const value = data.substring(i + 4, i + 4 + len);

      if (['26', '27', '28', '62', '51'].includes(tag)) {
        parsed[tag] = this.formatEMVQR(value);
      } else {
        parsed[tag] = value;
      }

      i += 4 + len;
    }

    return parsed;
  }

  async scanQrCode() {
    this.scanning = true;
    this.scanSuccess = false;

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
      });

      if (!result?.ScanResult) {
        this.returnToPayPage();
        return;
      }

      this.scannedResult = result.ScanResult;
      this.parsedEMV = this.formatEMVQR(result.ScanResult);

      this.walletData = {
        name: this.parsedEMV?.['59'] || '',
        account:
          this.parsedEMV?.['26']?.['04'] ||
          this.parsedEMV?.['26']?.['01'] ||
          this.parsedEMV?.['27']?.['04'] ||
          this.parsedEMV?.['27']?.['01'] ||
          '',
        amount: this.parsedEMV?.['54']
          ? parseFloat(this.parsedEMV['54'])
          : 0,
      };

      this.scanSuccess = true;
    } catch (err) {
      console.warn('Scan cancelled or failed', err);
      this.returnToPayPage();
    } finally {
      this.scanning = false;
    }
  }

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  truncateAddress(address: string): string {
    return this.polkadotJsService.truncateAddress(address);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;

      const chain = this.chainsService.getChainById(this.currentWallet.chain_id);
      if (chain) {
        this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, chain)
      }
    }
  }

  onSendMoney() {
    console.log('Send money clicked');
  }

  returnToPayPage() {
    this.scanning = false;
    this.router.navigate(['/xterium/pay']);
  }

  async ngOnInit() {
    await this.scanQrCode();
    await this.getCurrentWallet();
  }
}
