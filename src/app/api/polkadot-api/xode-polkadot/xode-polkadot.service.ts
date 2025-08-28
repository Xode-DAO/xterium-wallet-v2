import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import { xodePolkadot } from "@polkadot-api/descriptors"
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';

import { Token, TokenPrices } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class XodePolkadotService {
  private wsProvider = "wss://xode-polkadot-rpc-01.zeeve.net/y0yxg038wn1fncc/rpc";

  private client = createClient(getWsProvider(this.wsProvider));
  private xodeApi = this.client.getTypedApi(xodePolkadot);

  async getTokens(): Promise<Token[]> {
    const xodeChainSpecs = this.client.getChainSpecData();

    const xodeChainName = (await xodeChainSpecs).name;
    const xodeTokenSymbol = (await xodeChainSpecs).properties['tokenSymbol'];
    const xodeTokenDecimals = (await xodeChainSpecs).properties['tokenDecimals'];
    const xodeTotalTokenSupply = Number(await this.xodeApi.query.Balances.TotalIssuance.getValue())

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      network_id: 2,
      name: xodeChainName,
      symbol: xodeTokenSymbol,
      decimals: xodeTokenDecimals,
      total_supply: xodeTotalTokenSupply,
      type: "native",
      image: ""
    }

    tokens.push(nativeToken);

    const assets = await this.xodeApi.query.Assets.Asset.getEntries();
    await Promise.all(
      assets.map(async (asset) => {
        const assetId = asset.keyArgs[0];
        if (!assetId) return;

        const metadata = await this.xodeApi.query.Assets.Metadata.getValue(assetId);
        const assetToken: Token = {
          id: uuidv4(),
          reference_id: assetId,
          network_id: 2,
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
            price = tokenPrices.find(p => p.token.id === token.id)?.price || 0;
          }

          if (token.type === 'native') {
            const balanceAccount = await this.xodeApi.query.System.Account.getValue(publicKey);
            balances.push({
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
              price,
              amount: Number(balanceAccount.data.free) * price,
            });
          } else {
            const assetId = token.reference_id;
            const account = await this.xodeApi.query.Assets.Account.getValue(Number(assetId), publicKey);
            const metadata = await this.xodeApi.query.Assets.Metadata.getValue(Number(assetId));

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
