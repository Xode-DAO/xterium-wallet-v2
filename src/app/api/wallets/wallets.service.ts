import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { Preferences } from '@capacitor/preferences';
import { Wallet } from "./../../../models/wallet.model"

@Injectable({
  providedIn: 'root'
})
export class WalletsService {
  private readonly WALLETS_STORAGE_KEY = 'wallets';
  private readonly CURRENT_WALLET_STORAGE_KEY = 'current_wallet';

  private currentWalletSubject = new BehaviorSubject<Wallet | undefined>(undefined);
  public currentWalletObservable = this.currentWalletSubject.asObservable();

  constructor() { }

  async create(wallet: Wallet): Promise<void> {
    const wallets = await this.getAllWallets();
    wallets.push(wallet);

    await Preferences.set({
      key: this.WALLETS_STORAGE_KEY,
      value: JSON.stringify(wallets)
    });
  }

  async getAllWallets(): Promise<Wallet[]> {
    const { value } = await Preferences.get({ key: this.WALLETS_STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async getWalletsByNetworkId(networkId: number): Promise<Wallet[]> {
    const wallets = await this.getAllWallets();
    return wallets.filter(w => w.network_id === networkId);
  }

  async getWalletByPublicKey(publicKey: string): Promise<Wallet | undefined> {
    const wallets = await this.getAllWallets();
    return wallets.find(w => w.public_key === publicKey);
  }

  async getWalletById(id: string): Promise<Wallet | undefined> {
    const wallets = await this.getAllWallets();
    return wallets.find(w => w.id === id);
  }

  async getCurrentWallet(): Promise<Wallet | undefined> {
    const { value } = await Preferences.get({ key: this.CURRENT_WALLET_STORAGE_KEY });
    return value ? JSON.parse(value) : undefined;
  }

  async update(id: string, updatedWallet: Partial<Wallet>): Promise<boolean> {
    const wallets = await this.getAllWallets();
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
    const wallets = await this.getAllWallets();
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
    const wallet = await this.getWalletById(id);
    if (wallet) {
      await Preferences.set({
        key: this.CURRENT_WALLET_STORAGE_KEY,
        value: JSON.stringify(wallet)
      });

      this.currentWalletSubject.next(wallet);

      return true;
    }

    return false;
  }
}
