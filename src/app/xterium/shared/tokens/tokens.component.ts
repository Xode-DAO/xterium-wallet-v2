import { Component, OnInit } from '@angular/core';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { Wallet } from 'src/models/wallet.model';
import { Network } from 'src/models/network.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { XodePolkadotService } from 'src/app/api/polkadot-js/xode-polkadot/xode-polkadot.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { NetworksService } from 'src/app/api/networks/networks.service';

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
    IonAvatar
  ]
})
export class TokensComponent implements OnInit {
  constructor(
    private polkadotJsService: PolkadotJsService,
    private xodePolkadotService: XodePolkadotService,
    private walletsService: WalletsService,
    private networksService: NetworksService
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

  async getTokenBalances(): Promise<void> {
    this.tokens = await this.xodePolkadotService.getTokens();
    this.getBalances();
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

  async getBalances(): Promise<void> {
    await this.getCurrentWallet();
    this.balances = await this.xodePolkadotService.getBalances(this.tokens, this.currentWalletPublicAddress)

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
  }
}
