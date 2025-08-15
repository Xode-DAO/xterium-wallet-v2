import { Injectable } from '@angular/core';

import { Preferences } from '@capacitor/preferences';
import { Wallet } from "./../../../models/wallet.model"

@Injectable({
  providedIn: 'root'
})
export class WalletsService {
  private readonly WALLETS_STORAGE_KEY = 'wallets';
  private readonly CURRENT_WALLET_STORAGE_KEY = 'current_wallet';

  constructor() { }

  async create(wallet: Wallet): Promise<void> {
    const wallets = await this.getAll();
    wallets.push(wallet);

    await Preferences.set({
      key: this.WALLETS_STORAGE_KEY,
      value: JSON.stringify(wallets)
    });
  }

  async getAll(): Promise<Wallet[]> {
    const { value } = await Preferences.get({ key: this.WALLETS_STORAGE_KEY });
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

  async getById(id: string): Promise<Wallet | undefined> {
    const wallets = await this.getAll();
    return wallets.find(w => w.id === id);
  }

  async getCurrentWallet(): Promise<Wallet | undefined> {
    const { value } = await Preferences.get({ key: this.CURRENT_WALLET_STORAGE_KEY });
    return value ? JSON.parse(value) : undefined;
  }

  async update(id: string, updatedWallet: Partial<Wallet>): Promise<boolean> {
    const wallets = await this.getAll();
    const index = wallets.findIndex(w => w.id === id);

    if (index !== -1) {
      wallets[index] = { ...wallets[index], ...updatedWallet };

      await Preferences.set({
        key: this.WALLETS_STORAGE_KEY,
        value: JSON.stringify(wallets)
      });

      return true;
    }

    return false;
  }

  async delete(id: string): Promise<boolean> {
    const wallets = await this.getAll();
    const newWallets = wallets.filter(w => w.id !== id);

    if (newWallets.length !== wallets.length) {
      await Preferences.set({
        key: this.WALLETS_STORAGE_KEY,
        value: JSON.stringify(newWallets)
      });

      return true;
    }

    return false;
  }

  async setCurrentWallet(id: string): Promise<boolean> {
    const wallet = await this.getById(id);
    if (wallet) {
      await Preferences.set({
        key: this.CURRENT_WALLET_STORAGE_KEY,
        value: JSON.stringify(wallet)
      });

      return true;
    }

    return false;
  }
}
