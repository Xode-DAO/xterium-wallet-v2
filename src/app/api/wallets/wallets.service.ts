import { Injectable } from '@angular/core';

import { Preferences } from '@capacitor/preferences';
import { Wallet } from "./../../../models/wallet.model"

@Injectable({
  providedIn: 'root'
})
export class WalletsService {
  private readonly STORAGE_KEY = 'wallets';

  constructor() { }

  async create(wallet: Wallet): Promise<void> {
    const wallets = await this.getAll();
    wallets.push(wallet);

    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(wallets)
    });
  }

  async getAll(): Promise<Wallet[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async getAllByNetwork(network: string): Promise<Wallet[]> {
    const wallets = await this.getAll();
    return wallets.filter(w => w.network.toLowerCase() === network.toLowerCase());
  }

  async getByPublicKey(publicKey: string): Promise<Wallet | undefined> {
    const wallets = await this.getAll();
    return wallets.find(w => w.public_key === publicKey);
  }

  async getByPrivateKey(privateKey: string): Promise<Wallet | undefined> {
    const wallets = await this.getAll();
    return wallets.find(w => w.private_key === privateKey);
  }

  async update(privateKey: string, updatedWallet: Partial<Wallet>): Promise<boolean> {
    const wallets = await this.getAll();
    const index = wallets.findIndex(w => w.private_key === privateKey);

    if (index !== -1) {
      wallets[index] = { ...wallets[index], ...updatedWallet };

      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(wallets)
      });

      return true;
    }

    return false;
  }

  async delete(publicKey: string): Promise<boolean> {
    const wallets = await this.getAll();
    const newWallets = wallets.filter(w => w.public_key !== publicKey);

    if (newWallets.length !== wallets.length) {
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(newWallets)
      });

      return true;
    }

    return false;
  }
}
