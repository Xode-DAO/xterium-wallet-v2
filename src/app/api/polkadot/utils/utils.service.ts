import { Injectable } from '@angular/core';

import {
  cryptoWaitReady,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  sr25519PairFromSeed,
} from "@polkadot/util-crypto"
import { u8aToHex, hexToU8a, stringToHex } from '@polkadot/util';
import { encodeAddress, decodeAddress, Keyring } from '@polkadot/keyring';
import { u8aEq } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, SignerPayloadJSON } from '@polkadot/types/types';
import type { AccountInfo } from '@polkadot/types/interfaces';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {

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

  async deriveKeypair(mnemonic: string, derivationPath: string): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    await this.ensureReady();

    const keyring = new Keyring({ type: 'sr25519' });

    const uri = `${mnemonic}${derivationPath}`;
    const derivedPair = keyring.addFromUri(uri);

    const { secretKey } = sr25519PairFromSeed(derivedPair.derive('').publicKey);

    return {
      publicKey: derivedPair.publicKey,
      secretKey: secretKey
    };
  }

  async validatePrivateKey(privateKeyHex: string): Promise<{ valid: boolean, publicKey?: Uint8Array; secretKey?: Uint8Array; error?: string; }> {
    await this.ensureReady();

    try {
      let privateKey = hexToU8a(privateKeyHex);
      const keyLength = privateKey.length;

      if (keyLength !== 32 && keyLength !== 64) {
        return { valid: false, error: "Invalid key length. Must be 32 or 64 bytes." };
      }

      if (keyLength === 64) {
        privateKey = privateKey.slice(0, 32);
      }

      try {
        const seed = privateKey.length === 64 ? privateKey.slice(0, 32) : privateKey;
        const keypair = sr25519PairFromSeed(seed);

        return {
          valid: true,
          publicKey: keypair.publicKey,
          secretKey: keypair.secretKey
        };
      } catch (_) { }

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

  isValidAddress(address: string): boolean {
    try {
      const decoded = decodeAddress(address);
      return !!decoded;
    } catch (e) {
      return false;
    }
  }

  payloadToHex(payload: string): string {
    const hex = stringToHex(payload);
    return hex;
  }

  normalizeToExtrinsicHex(hexData: string, api: ApiPromise): string {
    if (!hexData.startsWith('0x')) {
      hexData = '0x' + hexData;
    }

    try {
      api.registry.createType('Extrinsic', hexData);
      return hexData;
    } catch (error) {
      const call = api.registry.createType('Call', hexData);
      const extrinsic = api.tx(call);
      return extrinsic.toHex();
    }
  }

  async createSignerPayload(api: ApiPromise, extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>, signerAddress: string): Promise<SignerPayloadJSON> {
    const runtimeVersion = api.runtimeVersion;
    const blockHash = await api.rpc.chain.getBlockHash();
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    const blockNumber = signedBlock.block.header.number;
    const era = api.registry.createType('ExtrinsicEra');
    const genesisHash = api.genesisHash;
    const accountInfo = await api.query['system']['account'](signerAddress) as AccountInfo;
    const nonce = accountInfo.nonce.toNumber();

    const signerPayload: SignerPayloadJSON = {
      specVersion: runtimeVersion.specVersion.toHex(),
      transactionVersion: runtimeVersion.transactionVersion.toHex(),
      address: signerAddress,
      assetId: undefined,
      blockHash: blockHash.toHex(),
      blockNumber: blockNumber.toHex(),
      era: era.toHex(),
      genesisHash: genesisHash.toHex(),
      metadataHash: undefined,
      method: extrinsic.method.toHex(),
      nonce: api.registry.createType('Compact<u32>', nonce).toHex(),
      signedExtensions: api.registry.signedExtensions,
      tip: '0x00000000000000000000000000000000',
      version: extrinsic.version,
      withSignedTransaction: true,
    };

    if (api.registry.signedExtensions.includes('CheckMetadataHash')) {
      signerPayload.mode = 0;
    }

    return signerPayload;
  }
}
