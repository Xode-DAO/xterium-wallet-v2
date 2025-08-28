import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import { assethubPolkadot } from "@polkadot-api/descriptors"
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';

import { Token, TokenPrices } from 'src/models/token.model';
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
    const assethubTotalTokenSupply = Number(await this.assethubApi.query.Balances.TotalIssuance.getValue())

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      network_id: 1,
      name: assethubChainName,
      symbol: assethubTokenSymbol,
      decimals: assethubTokenDecimals,
      total_supply: assethubTotalTokenSupply,
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
          network_id: 1,
          name: metadata.name.asText(),
          symbol: metadata.symbol.asText(),
          decimals: metadata.decimals,
          total_supply: Number(asset.value.supply),
          type: "asset",
          image: ""
        };

        tokens.push(assetToken);
      })
    );

    return tokens;
  }

  async getBalances(tokens: Token[], tokenPrices: TokenPrices[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          let price = 0;
          if (tokenPrices.length > 0) {
            price = tokenPrices.find(p => p.token.symbol.toLowerCase() === token.symbol.toLowerCase())?.price || 0;
          }

          if (token.type === 'native') {
            const balanceAccount = await this.assethubApi.query.System.Account.getValue(publicKey);
            balances.push({
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
              price,
              amount: Number(balanceAccount.data.free) * price,
            });
          } else {
            const assetId = token.reference_id;
            const account = await this.assethubApi.query.Assets.Account.getValue(Number(assetId), publicKey);
            const metadata = await this.assethubApi.query.Assets.Metadata.getValue(Number(assetId));

            if (account && metadata) {
              assetBalances.push({
                id: uuidv4(),
                token,
                quantity: Number(account.balance),
                price,
                amount: Number(account.balance) * price,
              });
            }
          }
        })
      );

      assetBalances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));
      balances.push(...assetBalances);
    }

    return balances;
  }
}
