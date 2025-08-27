import { Injectable } from '@angular/core';

import {
  cryptoWaitReady,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  sr25519PairFromSeed
} from "@polkadot/util-crypto"
import { u8aToHex } from '@polkadot/util';
import { encodeAddress } from '@polkadot/keyring';

@Injectable({
  providedIn: 'root'
})
export class PolkadotJsService {

  private cryptoReady: Promise<boolean>;

  constructor() {
    this.cryptoReady = cryptoWaitReady();
  }

  async ensureReady() {
    await this.cryptoReady;
  }

  async generateMnemonic(): Promise<string> {
    await this.ensureReady();
    return mnemonicGenerate();
  }

  async validateMnemonic(mnemonic: string): Promise<boolean> {
    await this.ensureReady();
    return mnemonicValidate(mnemonic);
  }

  async generateMnemonicToMiniSecret(mnemonic: string): Promise<Uint8Array> {
    await this.ensureReady();
    return mnemonicToMiniSecret(mnemonic);
  }

  async createKeypairFromSeed(seed: Uint8Array): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    await this.ensureReady();

    const keypair = sr25519PairFromSeed(seed);
    return {
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey
    };
  }

  async encodePublicAddressByChainFormat(publicKey: Uint8Array, ss58Format: number): Promise<string> {
    await this.ensureReady();
    return encodeAddress(publicKey, ss58Format);
  }

  encodePrivateKeyToHex(secretKey: Uint8Array): string {
    return u8aToHex(secretKey);
  }

  truncateAddress(address: string, start = 6, end = 5): string {
    if (!address) return '';
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    const scaled = amount / Math.pow(10, decimals);

    let formatted: string;
    if (scaled >= 1_000_000_000_000) {
      formatted = (scaled / 1_000_000_000).toFixed(2) + " T";
    } else if (scaled >= 1_000_000_000) {
      formatted = (scaled / 1_000_000_000).toFixed(2) + " B";
    } else if (scaled >= 1_000_000) {
      formatted = (scaled / 1_000_000).toFixed(2) + " M";
    } else {
      formatted = scaled.toFixed(5);

      const parts = formatted.split(".");
      parts[0] = Number(parts[0]).toLocaleString();
      formatted = parts.join(".");
    }

    return `${formatted}`;
  }
}
