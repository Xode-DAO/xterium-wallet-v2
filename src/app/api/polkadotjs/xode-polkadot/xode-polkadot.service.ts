import { Injectable } from '@angular/core';

import * as lookup from './../../../../chains/xode-polkadot/interfaces/types-lookup';
import { WsProvider, ApiPromise } from '@polkadot/api';

@Injectable({
  providedIn: 'root'
})
export class XodePolkadotService {

  constructor() { }

  wsProvider = new WsProvider("wss://polkadot-rpcnode.xode.net");
  api = ApiPromise.create({ provider: this.wsProvider, types: lookup });

  async getBalances() {
    const api = await this.api;

    console.log((await api.query['assets']['asset'].entries()));
    console.log((await api.query['assets']['metadata'](1984)).toHuman());
  }
}
