import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

import "./../../../../chains/xode-polkadot/interfaces/augment-api";
import * as lookup from './../../../../chains/xode-polkadot/interfaces/types-lookup';
import { WsProvider, ApiPromise } from '@polkadot/api';

import { Token } from './../../../../models/token.model';
import { Balance } from './../../../../models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class XodePolkadotService {

  constructor() { }

  wsProvider = new WsProvider("wss://polkadot-rpcnode.xode.net");
  api = ApiPromise.create({ provider: this.wsProvider, types: lookup });

  async getTokens(): Promise<Token[]> {
    const tokens: Token[] = [];

    const api = await this.api;
    const rpcSystem = api.rpc['system'];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      network_id: 2,
      name: (await rpcSystem.chain()).toHuman(),
      symbol: ((await rpcSystem.properties()).tokenSymbol).toHuman()?.toString() ?? "",
      decimals: Number(((await rpcSystem.properties()).tokenDecimals).toHuman()?.toString()) || 0,
      type: "native"
    }

    tokens.push(nativeToken);

    const assets = await api.query['assets']['asset'].entries();

    if (assets.length > 0) {
      assets.map(async (asset) => {
        const assetId = asset[0].toHuman()?.toString().replace(/,/g, "");

        if (assetId) {
          const metadata = await api.query['assets']['metadata'](assetId);
          const assetToken: Token = {
            id: uuidv4(),
            reference_id: assetId,
            network_id: 2,
            name: metadata.name.toHuman()?.toString() ?? "",
            symbol: metadata.symbol.toHuman()?.toString() ?? "",
            decimals: metadata.decimals.toBn().toNumber() ?? 0,
            type: "asset"
          };

          tokens.push(assetToken);
        }
      })
    }

    return tokens;
  }

  async getBalances(tokens: Token[], publickKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];
    const api = await this.api;

    if (tokens.length > 0) {
      tokens.map(async (token) => {
        if (token.type === 'native') {
          const balanceAccount = await api.query['balances']['account'](publickKey);
          balances.push({
            id: uuidv4(),
            token: token,
            quantity: balanceAccount.free.toBn().toNumber(),
            price: 10,
            amount: balanceAccount.free.toBn().toNumber() * 10
          });
        } else {
          const assetId = token.reference_id.toString();
          const account = await api.query['assets']['account'](assetId, publickKey);
          const metadata = await api.query['assets']['metadata'](assetId);

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
