import { Injectable } from '@angular/core';

import { WalletsService } from 'src/app/api/wallets/wallets.service';
import { ChainsService } from '../chains/chains.service';

import { Wallet, WalletV1Mobile } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export class SyncWalletsService {
  constructor(
    private walletsService: WalletsService,
    private chainsService: ChainsService,
  ) { }

  syncWallets() {
    const existingWallets = localStorage.getItem("wallets");
    if (!existingWallets) {
      return;
    }

    const parsedExistingWallets = JSON.parse(existingWallets) as WalletV1Mobile[];
    if (parsedExistingWallets.length === 0) {
      return;
    }

    parsedExistingWallets.forEach(async (oldWallet) => {
      const chain = this.chainsService.getChainById(1);
      if (!chain) return;

      const newWallet: Wallet = {
        id: oldWallet.id.toString(),
        name: oldWallet.name,
        chain: chain,
        mnemonic_phrase: oldWallet.mnemonic_phrase,
        public_key: oldWallet.public_key,
        private_key: oldWallet.private_key,
      };

      const alreadyExists = await this.walletsService.getWalletByPublicKey(newWallet.public_key);
      if (!alreadyExists) {
        await this.walletsService.create(newWallet);
      }
    });

    localStorage.removeItem("wallets");
  }
}
