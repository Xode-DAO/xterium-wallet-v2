import { Component, OnInit, Input } from '@angular/core';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton
} from '@ionic/angular/standalone';

import { QRCodeComponent } from 'angularx-qrcode';

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

  constructor(
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private tokensService: TokensService,
  ) { }

  currentWallet: Wallet = {} as Wallet;
  currentChain: Chain = {} as Chain;
  currentWalletPublicAddress: string = '';

  qrImageIcon: string = "./../../../assets/icon/xterium-logo.png";

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

      const chain = this.chainsService.getChainById(this.currentWallet.chain_id);
      if (chain) {
        this.currentChain = chain;
        this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, chain)
      }
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
        this.qrImageIcon = "./../../../assets/images/chains/" + this.currentChain.image;
      }
    }, 500);
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
