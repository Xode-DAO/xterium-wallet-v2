import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { Wallet } from 'src/models/wallet.model';

import { v4 as uuidv4 } from 'uuid';

import GWalletData from 'src/data/G_wallet.json';

@Injectable({
  providedIn: 'root',
})
export class SyncWalletsService {
  private readonly LOCAL_STORAGE_KEY = 'local';

  constructor(
    private wallets: WalletsService,
    private polkadotJsService: PolkadotJsService

  ) {}

  async loadDataToLocalStorage() {
    await Preferences.set({
      key: this.LOCAL_STORAGE_KEY,
      value: JSON.stringify(GWalletData),
    });
  }

  async getDataFromLocalStorage() {
    const { value } = await Preferences.get({ key: this.LOCAL_STORAGE_KEY });
    return value ? JSON.parse(value) : null;
  }

  private mapToNewModel(oldModel: any): Wallet {
    const wallet = new Wallet();

    wallet.id = uuidv4(),
    wallet.name = oldModel.name,
    wallet.network_id = oldModel.network_id ?? wallet.network_id,
    wallet.mnemonic_phrase = oldModel.mnemonic_phrase,
    wallet.public_key = oldModel.public_key,
    wallet.private_key = oldModel.private_key;

    return wallet;
  }

  async migrateToNewModel() {
    const walletsArray = Array.isArray(GWalletData) ? GWalletData : [GWalletData];

    const migrated: Wallet[] = walletsArray.map((w: any) => this.mapToNewModel({ ...w }));

    const existingWallets = await this.wallets.getAllWallets();
    let firstNewWallet: Wallet | null = null;

    for (const wallet of migrated) {
      const alreadyExists = existingWallets.some((w) => w.public_key === wallet.public_key);

      if (!alreadyExists) {
        await this.wallets.create(wallet);

        if (!firstNewWallet) {
          firstNewWallet = wallet;
        }
      }
    }

    const currentWallet = await this.wallets.getCurrentWallet();
    if (!currentWallet && firstNewWallet) {
      await this.wallets.setCurrentWallet(firstNewWallet.id);
    }

    await Preferences.remove({ key: this.LOCAL_STORAGE_KEY });
  }

  async updateWallet() {
    const current = await this.wallets.getCurrentWallet();
    if (!current) {
      console.warn('No current wallet found to regenerate.');
      return;
    }
    
    const mnemonic = await this.polkadotJsService.generateMnemonic();
    const seed = await this.polkadotJsService.generateMnemonicToMiniSecret(mnemonic);
    const keypair = await this.polkadotJsService.createKeypairFromSeed(seed);

    const updatedWallet: Partial<Wallet> = {
      mnemonic_phrase: mnemonic,
      public_key: keypair.publicKey.toString(),
      private_key: keypair.secretKey.toString()
    }

    const success = await this.wallets.update(current.id, updatedWallet);
    if (success) {
      await this.wallets.setCurrentWallet(current.id);
    }
  }
}
