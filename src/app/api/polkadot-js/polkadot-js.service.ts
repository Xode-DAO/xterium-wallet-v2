import { Injectable } from '@angular/core';

import {
  cryptoWaitReady,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  sr25519PairFromSeed,
  ed25519PairFromSeed,
  secp256k1PairFromSeed
} from "@polkadot/util-crypto"
import { Keypair } from '@polkadot/util-crypto/types';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { encodeAddress } from '@polkadot/keyring';
import { u8aEq } from '@polkadot/util';

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

  async validatePrivateKey(privateKeyHex: string): Promise<{ valid: boolean, publicKey?: Uint8Array; secretKey?: Uint8Array; error?: string; }> {
    await this.ensureReady();

    try {
      let privateKey = hexToU8a(privateKeyHex);

      if (privateKey.length === 64) {
        privateKey = privateKey.slice(0, 32);
      }

      if (privateKey.length !== 32) {
        return { valid: false, error: "Invalid key length. Must be 32 or 64 bytes." };
      }

      let keypair: Keypair | undefined;

      try { keypair = sr25519PairFromSeed(privateKey); } catch (_) { }
      if (!keypair) { try { keypair = ed25519PairFromSeed(privateKey); } catch (_) { } }
      if (!keypair) { try { keypair = secp256k1PairFromSeed(privateKey); } catch (_) { } }

      if (keypair) {
        return {
          valid: true,
          publicKey: keypair.publicKey,
          secretKey: keypair.secretKey
        };
      }

      return { valid: false, error: "Unsupported crypto type or invalid private key." };
    } catch (e: any) {
      return { valid: false, error: e.message || "Invalid private key." };
    }
  }

  encodePrivateKeyToHex(secretKey: Uint8Array): string {
    return u8aToHex(secretKey);
  }

  arePrivateKeysEqual(key1: string, key2: string): boolean {
    return u8aEq(hexToU8a(key1), hexToU8a(key2));
  }

  async encodePublicAddressByChainFormat(publicKey: Uint8Array, ss58Format: number): Promise<string> {
    await this.ensureReady();
    return encodeAddress(publicKey, ss58Format);
  }

  truncateAddress(address: string, start = 6, end = 5): string {
    if (!address) return '';
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  formatBalance(amount: number, decimals: number): number {
    return amount / Math.pow(10, decimals);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    const scaled = amount / Math.pow(10, decimals);

    let formatted: string;
    if (scaled >= 1_000_000_000_000) {
      formatted = (scaled / 1_000_000_000_000).toFixed(2) + " T";
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
