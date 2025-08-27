import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import { xodePolkadot } from "@polkadot-api/descriptors"
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class XodePolkadotService {
  private XODE_WSPROVIDER = "wss://xode-polkadot-rpc-01.zeeve.net/y0yxg038wn1fncc/rpc";

  private client = createClient(getWsProvider(this.XODE_WSPROVIDER));
  private xodeApi = this.client.getTypedApi(xodePolkadot);

  async getTokens(): Promise<Token[]> {
    const xodeChainSpecs = this.client.getChainSpecData();

    const xodeChainName = (await xodeChainSpecs).name;
    const xodeTokenSymbol = (await xodeChainSpecs).properties['tokenSymbol'];
    const xodeTokenDecimals = (await xodeChainSpecs).properties['tokenDecimals'];

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      network_id: 2,
      name: xodeChainName,
      symbol: xodeTokenSymbol,
      decimals: xodeTokenDecimals,
      type: "native",
      image: ""
    }

    tokens.push(nativeToken);

    const assets = await this.xodeApi.query.Assets.Asset.getEntries();
    if (assets.length > 0) {
      assets.map(async (asset) => {
        const assetId = asset.keyArgs[0];

        if (assetId) {
          const metadata = await this.xodeApi.query.Assets.Metadata.getValue(assetId);
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
        }
      });
    }

    return tokens;
  }

  async getBalances(tokens: Token[], publickKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      tokens.map(async (token) => {
        if (token.type === 'native') {
          const balanceAccount = await this.xodeApi.query.Balances.Account.getValue(publickKey);
          balances.push({
            id: uuidv4(),
            token: token,
            quantity: Number(balanceAccount.free),
            price: 10,
            amount: Number(balanceAccount.free) * 10
          });
        } else {
          const assetId = token.reference_id;
          const account = await this.xodeApi.query.Assets.Account.getValue(Number(assetId), publickKey);
          const metadata = await this.xodeApi.query.Assets.Metadata.getValue(Number(assetId));

          if (account && metadata) {
            balances.push({
              id: uuidv4(),
              token: token,
              quantity: 0,
              price: 0,
              amount: 0
            });
          }
        }
      });
    }

    return balances;
  }
}
