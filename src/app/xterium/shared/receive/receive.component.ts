import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  ToastController,
} from '@ionic/angular/standalone';

import { QRCodeComponent } from 'angularx-qrcode';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

import { Wallet } from 'src/models/wallet.model';
import { Chain } from 'src/models/chain.model';
import { Token } from 'src/models/token.model';

import { ChainsService } from 'src/app/api/chains/chains.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { TokensService } from 'src/app/api/tokens/tokens.service';

@Component({
  selector: 'app-receive',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.scss'],
  imports: [
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    QRCodeComponent
  ]
})
export class ReceiveComponent implements OnInit {
  @Input() token: Token | null = null;
  @ViewChild('qrcode', { static: false }) qrcodeElement!: QRCodeComponent;

  constructor(
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private tokensService: TokensService,
    private toastController: ToastController
  ) { }

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  qrImageIcon: string = "./../../../assets/icon/xterium-logo.png";
  isSharing: boolean = false;

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  truncateAddress(address: string): string {
    return this.polkadotJsService.truncateAddress(address);
  }

  async fetchData(): Promise<void> {
    await this.getCurrentWallet();
    await this.getTokenImage();
  }

  async getTokenImage(): Promise<void> {
    setTimeout(async () => {
      if (this.token) {
        await this.tokensService.attachIcon(this.token);
      } else {
        this.qrImageIcon = "./../../../assets/images/chains/" + this.currentWallet.chain.image;
      }
    }, 500);
  }

  async shareAddress(): Promise<void> {
    this.isSharing = true;

    try {
      const canvas = await this.createHighQualityQRCodeImage();
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      const base64Data = dataUrl.split(',')[1];
      
      const fileName = `${this.currentWallet.name}.png`;

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true
        });

        let fileUri = result.uri;
        
        if (Capacitor.getPlatform() === 'android') {
          const fileInfo = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache
          });
          fileUri = fileInfo.uri;
        }

        await Share.share({
          title: `${this.currentWallet.name} - ${this.currentWallet.chain.name} Wallet Address`,
          text: `Here's my ${this.currentWallet.chain.name} wallet address: ${this.currentWalletPublicAddress}\n\nScan the QR code to send funds.`,
          url: fileUri,
          dialogTitle: 'Share Wallet Address'
        });

        const toast = await this.toastController.create({
          message: 'Address shared successfully!',
          color: 'success',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      } else {
        const blob = await this.dataURLToBlob(dataUrl);
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.share && navigator.canShare) {
          const shareData = {
            title: `${this.currentWallet.name} - ${this.currentWallet.chain.name} Wallet Address`,
            text: `Here's my ${this.currentWallet.chain.name} wallet address: ${this.currentWalletPublicAddress}`,
            files: [file],
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            
            const toast = await this.toastController.create({
              message: 'Address shared successfully!',
              color: 'success',
              duration: 1500,
              position: 'top',
            });

            await toast.present();
          } else {
            this.downloadQRCode(canvas);
          }
        } else {
          this.downloadQRCode(canvas);
        }
      }
    } catch (error) {
      console.error('Error sharing address:', error);
      
      const toast = await this.toastController.create({
        message: 'Failed to share address. Please try again.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } finally {
      this.isSharing = false;
    }
  }

  private async downloadQRCode(canvas: HTMLCanvasElement): Promise<void> {
    try {
      const link = document.createElement('a');
      link.download = `${this.currentWallet.name}.png`;
      link.href = canvas.toDataURL('image/png', 1.0); 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const toast = await this.toastController.create({
        message: 'QR code downloaded successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      
      const toast = await this.toastController.create({
        message: 'Failed to download QR code.',
        color: 'danger',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    }
  }

   private async dataURLToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  private async createHighQualityQRCodeImage(): Promise<HTMLCanvasElement> {
    const qrCanvas = document.querySelector('qrcode canvas') as HTMLCanvasElement;
    if (!qrCanvas) throw new Error('QR code canvas not found');

    const scaleFactor = 2;
    const bottomSpace = 80 * scaleFactor;

    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d')!;

    finalCanvas.width = 800 * scaleFactor;
    finalCanvas.height = 1000 * scaleFactor + bottomSpace;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    const topPadding = 80 * scaleFactor;
    const logoHeight = 200 * scaleFactor;

    await this.drawXteriumLogo(ctx, finalCanvas.width / 2, topPadding + logoHeight / 2, logoHeight, scaleFactor);

    const qrSize = 400 * scaleFactor;
    const qrX = (finalCanvas.width - qrSize) / 2;
    const qrY = topPadding + logoHeight + 70 * scaleFactor;

    const borderRadius = 25 * scaleFactor;
    const borderWidth = 16 * scaleFactor;

    const roundedQrCanvas = document.createElement('canvas');
    roundedQrCanvas.width = qrSize + borderWidth * 2;
    roundedQrCanvas.height = qrSize + borderWidth * 2;

    const roundedCtx = roundedQrCanvas.getContext('2d')!;
    roundedCtx.fillStyle = '#ffffff';
    roundedCtx.beginPath();
    roundedCtx.roundRect(0, 0, roundedQrCanvas.width, roundedQrCanvas.height, borderRadius);
    roundedCtx.fill();

    roundedCtx.beginPath();
    roundedCtx.roundRect(
      borderWidth,
      borderWidth,
      roundedQrCanvas.width - borderWidth * 2,
      roundedQrCanvas.height - borderWidth * 2,
      borderRadius - borderWidth * 0.5
    );
    roundedCtx.fillStyle = '#ffffff';
    roundedCtx.fill();

    roundedCtx.drawImage(
      qrCanvas,
      borderWidth,
      borderWidth,
      roundedQrCanvas.width - borderWidth * 2,
      roundedQrCanvas.height - borderWidth * 2
    );

    ctx.drawImage(roundedQrCanvas, qrX - borderWidth, qrY - borderWidth);

    // Address Display
    ctx.font = `${18 * scaleFactor}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Address:', finalCanvas.width / 2, qrY + qrSize + 60 * scaleFactor);

    ctx.font = `bold ${20 * scaleFactor}px Arial, sans-serif`;
    const address = this.currentWalletPublicAddress;
    const midPoint = Math.floor(address.length / 2);
    ctx.fillText(address.substring(0, midPoint), finalCanvas.width / 2, qrY + qrSize + 90 * scaleFactor);
    ctx.fillText(address.substring(midPoint), finalCanvas.width / 2, qrY + qrSize + 120 * scaleFactor);

    // Network Display
    const networkY = qrY + qrSize + 170 * scaleFactor;
    ctx.font = `${18 * scaleFactor}px Arial, sans-serif`;
    ctx.fillText('Network:', finalCanvas.width / 2, networkY);

    ctx.font = `bold ${20 * scaleFactor}px Arial, sans-serif`;
    ctx.fillText(this.currentWallet.chain.name, finalCanvas.width / 2, networkY + 30 * scaleFactor);

    return finalCanvas;
  }

  private async drawXteriumLogo(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number,
    logoHeight: number,
    scaleFactor: number
  ): Promise<void> {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    return new Promise(resolve => {
      logoImg.onload = () => {
        const aspectRatio = logoImg.width / logoImg.height;
        const logoWidth = logoHeight * aspectRatio;
        ctx.drawImage(logoImg, centerX - logoWidth / 2, y - logoHeight / 2, logoWidth, logoHeight);
        resolve();
      };

      logoImg.onerror = () => {
        console.warn('Failed to load XTERIUM logo');
        resolve();
      };

      logoImg.src = './../../../assets/icon/xterium-logo-with-text.png';
    });
  }

  ngOnInit() {
    this.fetchData();

    this.tokensService.tokenImageObservable.subscribe(tokenImage => {
      if (tokenImage) {
        this.qrImageIcon = tokenImage.image;
      }
    });
  }
}