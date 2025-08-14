import { Injectable } from '@angular/core';

import {
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
export class PolkadotjsService {

  constructor() { }

  generateMnemonic(): string {
    return mnemonicGenerate();
  }

  validateMnemonic(mnemonic: string): boolean {
    return mnemonicValidate(mnemonic);
  }

  generateMnemonicToMiniSecret(mnemonic: string): Uint8Array {
    return mnemonicToMiniSecret(mnemonic);
  }

  createKeypairFromSeed(seed: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array } {
    const keypair = sr25519PairFromSeed(seed);

    return {
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey
    };
  }

  encodePublicAddressByChainFormat(publicKey: Uint8Array, ss58Format: number): string {
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
}
