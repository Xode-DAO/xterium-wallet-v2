import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import { assethubPolkadot } from "@polkadot-api/descriptors"
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class AssethubPolkadotService {
  private wsProvider = "wss://polkadot-asset-hub-rpc.polkadot.io";

  private client = createClient(getWsProvider(this.wsProvider));
  private assethubApi = this.client.getTypedApi(assethubPolkadot);

  async getTokens(): Promise<Token[]> {
    const assethubChainSpecs = this.client.getChainSpecData();

    const assethubChainName = (await assethubChainSpecs).name;
    const assethubTokenSymbol = (await assethubChainSpecs).properties['tokenSymbol'];
    const assethubTokenDecimals = (await assethubChainSpecs).properties['tokenDecimals'];

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      network_id: 2,
      name: assethubChainName,
      symbol: assethubTokenSymbol,
      decimals: assethubTokenDecimals,
      type: "native",
      image: ""
    }

    tokens.push(nativeToken);

    const assets = await this.assethubApi.query.Assets.Asset.getEntries();
    await Promise.all(
      assets.map(async (asset) => {
        const assetId = asset.keyArgs[0];
        if (!assetId) return;

        const metadata = await this.assethubApi.query.Assets.Metadata.getValue(assetId);
        const assetToken: Token = {
          id: uuidv4(),
          reference_id: assetId,
          network_id: 2,
          name: metadata.name.asText(),
          symbol: metadata.symbol.asText(),
          decimals: metadata.decimals,
          type: "asset",
          image: ""
        };

        tokens.push(assetToken);
      })
    );

    return tokens;
  }

  async getBalances(tokens: Token[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      await Promise.all(tokens.map(async (token) => {
        if (token.type === 'native') {
          const balanceAccount = await this.assethubApi.query.System.Account.getValue(publicKey);
          balances.push({
            id: uuidv4(),
            token,
            quantity: Number(balanceAccount.data.free),
            price: 0,
            amount: Number(balanceAccount.data.free) * 0,
          });
        } else {
          const assetId = token.reference_id;
          const account = await this.assethubApi.query.Assets.Account.getValue(Number(assetId), publicKey);
          const metadata = await this.assethubApi.query.Assets.Metadata.getValue(Number(assetId));

          if (account && metadata) {
            balances.push({
              id: uuidv4(),
              token,
              quantity: Number(account.balance),
              price: 0,
              amount: Number(account.balance) * 0,
            });
          }
        }
      }));
    }

    return balances;
  }
}
