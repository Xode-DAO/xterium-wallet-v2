import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonItem, 
  IonLabel,
  IonText
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, close } from 'ionicons/icons';

import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { BrowserQRCodeReader } from '@zxing/browser';

import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-qr-upload',
  templateUrl: './qr-upload.page.html',
  styleUrls: ['./qr-upload.page.scss'],
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonButton,
    IonItem, 
    IonLabel,
    IonText,
  ],
})
export class QrUploadPage implements OnInit {

  walletData: {
    name?: string;
    account?: string;
    amount?: number;
  } = {};

  availableUSDt: number = 0;

  selectedNetwork: Chain = {} as Chain;
  currentWallet: Wallet = {} as Wallet;

  currentWalletPublicAddress: string = '';

  scannedResult: string | null = null;
  isUploading = false;
  uploadSuccess = false;
  parsedEMV: any = null;

  tokenDetails = {
    token: 'USDt',
    amount: 9.969981,
    pricePerToken: 1.003011,
  };

  constructor(
    private router: Router,
    private polkadotJsService: PolkadotJsService,
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

  async uploadQr() {
    try {
      this.isUploading = true;
      this.uploadSuccess = false;
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
      });

      const qrReader = new BrowserQRCodeReader();
      const result = await qrReader.decodeFromImageUrl(photo.dataUrl);

      this.scannedResult = result.getText();
      this.parsedEMV = this.formatEMVQR(result.getText());

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

      this.uploadSuccess = true;
    } catch (error: any) {
      console.error('QR decode error:', error);

      if (error && (error.message.includes('cancel') || error === 'User cancelled photos app')) {
      this.router.navigate(['/xterium/pay']);
      return;
    }
      this.scannedResult = 'Invalid or unreadable QR image';
    } finally {
      this.isUploading = false;
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
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  onSendMoney() {
    console.log('Send money clicked');
  }

   returnToPayPage() {
    this.router.navigate(['/xterium/pay']);
  }

  async ngOnInit() {
    await this.uploadQr();
    await this.getCurrentWallet();
  }
}
