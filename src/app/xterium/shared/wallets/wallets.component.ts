import { Component, OnInit, ViewChild, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  IonChip
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, createOutline, wallet } from 'ionicons/icons';

import { NetworksComponent } from 'src/app/xterium/shared/networks/networks.component';
import { ChainsComponent } from "src/app/xterium/shared/chains/chains.component";
import { WalletDetailsComponent } from 'src/app/xterium/shared/wallets/wallet-details/wallet-details.component';

import { Network, NetworkMetadata } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';
import { Wallet } from 'src/models/wallet.model'

import { UtilsService } from 'src/app/api/polkadot/utils/utils.service';
import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';
import { ChainsService } from 'src/app/api/chains/chains.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

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
    NetworksComponent,
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

  @Output() onFilteredNetworkMetadata = new EventEmitter<NetworkMetadata>();
  @Output() onFilteredChain = new EventEmitter<Chain>();
  @Output() onSetCurrentWallet = new EventEmitter<Wallet>();

  constructor(
    private utilsService: UtilsService,
    private networkMetadataService: NetworkMetadataService,
    private chainsService: ChainsService,
    private walletsService: WalletsService,
  ) {
    addIcons({
      ellipsisVerticalOutline,
      createOutline,
      wallet
    });
  }

  networkMetadatas: NetworkMetadata[] = [];
  selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();

  chains: Chain[] = [];
  chainsByName: Record<string, Chain[]> = {};
  selectedChain: Chain = new Chain();

  wallets: Wallet[] = [];
  walletsByChain: Record<string, Wallet[]> = {};
  selectedWallet: Wallet = new Wallet();

  currentWallet: Wallet = new Wallet();
  currentWalletPublicAddress: string = '';

  async getNetworkMetadatas(): Promise<void> {
    const allNetworkMetadatas = await this.networkMetadataService.getAllNetworkMetadatas();

    this.networkMetadatas = [...allNetworkMetadatas];
    this.selectedNetworkMetadata = this.networkMetadatas[0];

    await this.getChains();
  }

  async getChains(): Promise<void> {
    const allChains = this.chainsService.getChainsByNetwork(Network.AllNetworks);
    const filteredChains = this.chainsService.getChainsByNetwork(this.selectedNetworkMetadata.network);

    this.chains = [
      ...allChains,
      ...filteredChains
    ];
    this.selectedChain = this.chains[0];

    await this.loadChainByName();
  }

  async loadChainByName(): Promise<void> {
    this.chainsByName = {};

    if (this.selectedChain.name === "All Chains") {
      this.chainsByName["All Chains"] = this.chains;
    } else {
      const mapped = this.chains.filter(chain => chain.name.toLowerCase() === this.selectedChain.name.toLowerCase());
      this.chainsByName[this.selectedChain.name] = mapped;
    }

    await this.getWallets();
  }

  async getWallets(): Promise<void> {
    this.wallets = await this.walletsService.getAllWallets();
    await this.loadWalletsByChain();
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

      this.walletsByChain[chain.name] = mapped;
    }
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
    const matchedNetworkMetadata = this.networkMetadatas.find(
      metadata => metadata.network.toString() === this.currentWallet.chain.network.toString()
    );

    if (matchedNetworkMetadata) {
      this.selectedNetworkMetadata = matchedNetworkMetadata;
      await this.getChains();

      this.onFilteredNetworkMetadata.emit(matchedNetworkMetadata);

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
  }

  truncateAddress(address: string): string {
    return this.utilsService.truncateAddress(address);
  }

  openSelectNetworkMetadataModal() {
    this.selectNetworkMetadataModal.present();
  }

  onSelectedNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.selectedNetworkMetadata = networkMetadata;

    this.getChains();
    this.getWallets();

    this.selectNetworkMetadataModal.dismiss();

    this.onFilteredNetworkMetadata.emit(networkMetadata);
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
    await this.getNetworkMetadatas();
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
