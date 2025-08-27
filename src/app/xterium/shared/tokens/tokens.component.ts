import { Component, OnInit } from '@angular/core';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSpinner,
} from '@ionic/angular/standalone';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { XodePolkadotService } from 'src/app/api/polkadot-api/xode-polkadot/xode-polkadot.service';
import { AssethubPolkadotService } from 'src/app/api/polkadot-api/assethub-polkadot/assethub-polkadot.service';

import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { NetworksService } from 'src/app/api/networks/networks.service';
import { TokensService } from 'src/app/api/tokens/tokens.service';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonSpinner,
  ]
})
export class TokensComponent implements OnInit {
  constructor(
    private polkadotJsService: PolkadotJsService,
    private xodePolkadotService: XodePolkadotService,
    private assethubPolkadotService: AssethubPolkadotService,
    private walletsService: WalletsService,
    private networksService: NetworksService,
    private tokensService: TokensService
  ) { }

  tokens: Token[] = [];
  balances: Balance[] = [];

  balanceByToken: Record<string, Balance> = {};

  currentWallet: Wallet = {} as Wallet;
  currentWalletPublicAddress: string = '';

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

  async getTokenBalances(): Promise<void> {
    await this.getCurrentWallet();

    let tokens: Token[] = [];

    if (this.currentWallet.network_id === 1) tokens = await this.assethubPolkadotService.getTokens();
    if (this.currentWallet.network_id === 2) tokens = await this.xodePolkadotService.getTokens();

    this.tokens = tokens;

    await this.getBalances();
  }

  async getBalances(): Promise<void> {
    this.balances = await this.xodePolkadotService.getBalances(this.tokens, this.currentWalletPublicAddress)

    setTimeout(async () => {
      if (this.balances.length > 0) {
        let balanceTokens = this.balances.map(b => b.token);
        await this.tokensService.attachIcons(balanceTokens);
      }
    }, 500);

    this.loadBalanceByToken();
  }

  async loadBalanceByToken(): Promise<void> {
    this.balanceByToken = {};

    for (const token of this.tokens) {
      const filtered = this.balances.find(
        w => w.token?.id === token.id
      );

      if (filtered) {
        this.balanceByToken[token.id] = filtered;
      }
    }
  }

  ngOnInit() {
    this.walletsService.currentWalletObservable.subscribe(wallet => {
      this.getTokenBalances();
    });

    this.tokensService.tokenImagesObservable.subscribe(tokenImages => {
      if (tokenImages.length > 0) {
        for (let i = 0; i < tokenImages.length; i++) {
          let balanceToken = this.balances.filter(d => d.token.id === tokenImages[i].id)[0];
          if (balanceToken) {
            balanceToken.token.image = tokenImages[i].image;
          }
        }
      }
    });
  }
}
