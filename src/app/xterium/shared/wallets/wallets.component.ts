import { Component, OnInit, ViewChild, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { v4 as uuidv4 } from 'uuid';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonChip,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, createOutline, wallet } from 'ionicons/icons';

import { ChainsComponent } from "src/app/xterium/shared/chains/chains.component";
import { WalletDetailsComponent } from 'src/app/xterium/shared/wallets/wallet-details/wallet-details.component';

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { SettingsService } from 'src/app/api/settings/settings.service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonChip,
    ChainsComponent,
    WalletDetailsComponent,
    TranslatePipe
  ]
})
export class WalletsComponent implements OnInit {
  @ViewChild('selectNetworkMetadataModal', { read: IonModal }) selectNetworkMetadataModal!: IonModal;
  @ViewChild('selectChainModal', { read: IonModal }) selectChainModal!: IonModal;
  @ViewChild('walletDetailsModal', { read: IonModal }) walletDetailsModal!: IonModal;

  @Input() newlyAddedWallet: Wallet = new Wallet();

  @Output() onFilteredChain = new EventEmitter<Chain>();
  @Output() onSetCurrentWallet = new EventEmitter<Wallet>();

  constructor(
    private utilsService: UtilsService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
    private settingsService: SettingsService
  ) {
    addIcons({
      ellipsisVerticalOutline,
      createOutline,
      wallet
    });
  }

  chains: Chain[] = [];
  chainsById: Record<number, Chain[]> = {};
  selectedChain: Chain = new Chain();

  wallets: Wallet[] = [];
  walletsByChain: Record<number, Wallet[]> = {};
  selectedWallet: Wallet = new Wallet();

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  relatedWalletsByChain: Record<number, Wallet[]> = {};

  async getChains(): Promise<void> {
    const allChains = this.chainsService.getChainsByNetwork(Network.AllNetworks);
    const polkadotChains = this.chainsService.getChainsByNetwork(Network.Polkadot);

    this.chains = [
      ...allChains,
      ...polkadotChains,
    ];

    const settings = await this.settingsService.get();
    if (settings) {
      const developerMode = settings.user_preferences.testnet_enabled;
      if (developerMode) {
        const paseoChains = this.chainsService.getChainsByNetwork(Network.Paseo);
        const rococoChains = this.chainsService.getChainsByNetwork(Network.Rococo);

        this.chains = [
          ...allChains,
          ...polkadotChains,
          ...paseoChains,
          ...rococoChains,
        ];
      }
    }

    this.selectedChain = this.chains[0];
  }

  async loadChainByName(): Promise<void> {
    this.chainsById = {};

    if (this.selectedChain.id === 0) {
      this.chainsById[0] = this.chains;
    } else {
      const mapped = this.chains.filter(chain => chain.id === this.selectedChain.id);
      this.chainsById[this.selectedChain.id] = mapped;
    }

    await this.getWallets();
  }

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();
    await this.loadWalletsByChain();

    this.getRelatedWalletsPerNetwork();
  }

  async loadWalletsByChain(): Promise<void> {
    this.walletsByChain = {};

    for (const chain of this.chains) {
      const filtered = this.wallets.filter(
        w => w.chain.id === chain.id
      );

      const mapped = await Promise.all(
        filtered.map(async wallet => ({
          ...wallet,
          public_key: await this.encodePublicAddressByChainFormat(wallet.public_key, chain)
        }))
      );

      this.walletsByChain[chain.id] = mapped;
    }
  }

  getRelatedWalletsPerNetwork(): void {
    this.relatedWalletsByChain = {};

    if (this.chains.length > 0) {
      for (const chain of this.chains) {
        const chain_id = chain.id;
        const chain_wallets = this.wallets.filter(w => w.chain.id === chain.id);

        const rawPublicKeys = new Set<string>();

        for (const chainWallet of chain_wallets) {
          const originalWallet = this.wallets.find(w => w.id === chainWallet.id);
          if (originalWallet) {
            rawPublicKeys.add(originalWallet.public_key);
          }
        }

        const network = this.chains.find(c => c.id === chain_id)?.network;
        const relatedWallets = this.wallets.filter(w => {
          return w.chain.network === network &&
            w.chain.id !== chain_id &&
            !rawPublicKeys.has(w.public_key);
        });

        const groupedByPublicKey = relatedWallets.reduce((acc, wallet) => {
          if (!acc[wallet.public_key]) {
            acc[wallet.public_key] = { ...wallet };
          }
          return acc;
        }, {} as Record<string, Wallet>);

        this.relatedWalletsByChain[chain_id] = Object.values(groupedByPublicKey);
      }
    }
  }

  async createManyWallets(related_wallets: Wallet[], chain: Chain): Promise<void> {
    for (const wallet of related_wallets) {
      let newId = uuidv4();
      const newWallet: Wallet = new Wallet();
      newWallet.id = newId;
      newWallet.name = wallet.name;
      newWallet.chain = chain;
      newWallet.mnemonic_phrase = wallet.mnemonic_phrase;
      newWallet.public_key = wallet.public_key;
      newWallet.private_key = wallet.private_key;

      await this.walletsService.create(newWallet);
    }

    await this.getWallets();
  }

  async encodePublicAddressByChainFormat(publicKey: string, chain: Chain): Promise<string> {
    const publicKeyUint8 = new Uint8Array(
      publicKey.split(',').map(byte => Number(byte.trim()))
    );

    const ss58Format = typeof chain.address_prefix === 'number' ? chain.address_prefix : 0;
    return await this.utilsService.encodePublicAddressByChainFormat(publicKeyUint8, ss58Format);
  }

  async getCurrentWallet(): Promise<void> {
    const currentWallet = await this.walletsService.getCurrentWallet();
    if (currentWallet) {
      this.currentWallet = currentWallet;
      this.currentWalletPublicAddress = await this.encodePublicAddressByChainFormat(this.currentWallet.public_key, this.currentWallet.chain)
    }
  }

  async setCurrentFilters() {
    await this.getChains();

    const matchedChain = this.chains.find(
      chain => chain.id === this.currentWallet.chain.id
    );

    if (matchedChain) {
      this.selectedChain = matchedChain;

      await this.loadChainByName();
      await this.loadWalletsByChain();

      this.onFilteredChain.emit(matchedChain);
    }
  }

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  openSelectChainModal() {
    this.selectChainModal.present();
  }

  async onSelectedChain(chain: Chain) {
    this.selectedChain = chain;

    await this.loadChainByName();
    await this.loadWalletsByChain();

    this.selectChainModal.dismiss();

    this.onFilteredChain.emit(chain);
  }

  async setCurrentWallet(wallet: Wallet) {
    const walletById = await this.walletsService.getWalletById(wallet.id);
    if (walletById) {
      this.selectedWallet = walletById;

      await this.walletsService.setCurrentWallet(walletById.id);
      this.onSetCurrentWallet.emit(walletById);
    }
  }

  async openWalletDetailsModal(wallet: Wallet) {
    const walletById = await this.walletsService.getWalletById(wallet.id);
    if (walletById) {
      this.selectedWallet = walletById;
      this.walletDetailsModal.present();
    }
  }

  async onUpdatedWallet() {
    await this.getWallets();
    await this.getCurrentWallet();
  }

  async onDeletedWallet() {
    await this.getWallets();
    await this.getCurrentWallet();

    this.walletDetailsModal.dismiss();
  }

  async fetchData() {
    await this.getChains();
    await this.getCurrentWallet();
    await this.setCurrentFilters();
  }

  ngOnInit() {
    this.fetchData();
  }

  ngOnChanges(changes: SimpleChanges) {
    const wallet = changes['newlyAddedWallet']?.currentValue;
    if (wallet && Object.keys(wallet).length > 0) {
      this.getWallets();
      this.getCurrentWallet();
    }
  }
}
