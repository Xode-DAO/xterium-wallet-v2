import { Component, OnInit, Input } from '@angular/core';

import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton
} from '@ionic/angular/standalone';

import { QRCodeComponent } from 'angularx-qrcode';

import { Network } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model';
import { Token } from 'src/models/token.model';

import { NetworksService } from 'src/app/api/networks/networks.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { TokensService } from 'src/app/api/tokens/tokens.service';

@Component({
  selector: 'app-receive',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.scss'],
  imports: [
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

  constructor(
    private polkadotJsService: PolkadotJsService,
    private networksService: NetworksService,
    private walletsService: WalletsService,
    private tokensService: TokensService,
  ) { }

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

  qrImageIcon: string = "";

  async encodePublicAddressByChainFormat(publicKey: string, network: Network): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof network.address_prefix === 'number' ? network.address_prefix : 0;
    return await this.polkadotJsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;

      const network = this.networksService.getNetworkById(this.currentWallet.network_id);
      if (network) {
        this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, network)
      }
    }
  }

  truncateAddress(address: string): string {
    return this.polkadotJsService.truncateAddress(address);
  }

  async fetchData(): Promise<void> {
    await this.getCurrentWallet();
    await this.getBalanceTokenImages();
  }

  async getBalanceTokenImages(): Promise<void> {
    setTimeout(async () => {
      if (this.token) {
        let tokens: Token[] = [
          this.token
        ];
        await this.tokensService.attachIcons(tokens);
      } else {
        this.qrImageIcon = "./../../../assets/icon/xterium-logo.png";
      }
    }, 500);
  }

  ngOnInit() {
    this.fetchData();

    this.tokensService.tokenImagesObservable.subscribe(tokenImages => {
      if (tokenImages.length > 0) {
        for (let i = 0; i < tokenImages.length; i++) {
          this.qrImageIcon = tokenImages[i].image;
        }
      }
    });
  }
}
