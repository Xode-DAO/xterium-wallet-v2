import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

import { Transfers, Extrinsics } from 'src/models/transaction-history.model';
import { Chain, ScannerType } from 'src/models/chain.model';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  constructor(
    private http: HttpClient
  ) { }

  async fetchTransfers(address: string, chain: Chain): Promise<Transfers[]> {
    const transfers: Transfers[] = [];

    if (chain.scanner && chain.scanner.type === ScannerType.Subsquid) {
      if (chain.chain_id === 3417) {

      }
    }

    if (chain.scanner && chain.scanner.type === ScannerType.Subscan) {
      let page = 0;
      let row = 100;

      let hasMore = true;
      while (hasMore) {
        const body = {
          address: address,
          page: page,
          row: row,
        };

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'X-API-Key': '4d0c8ba32dde4a06bda83d52af49120f',
        });

        const response: any = await firstValueFrom(
          this.http.post(chain.scanner?.transfers_url || '', body, { headers })
        );

        const count = response.data.count;
        const transfersData = response.data.transfers || [];

        if (transfersData.length > 0) {
          for (const item of transfersData) {
            const isNativeTransfer = item.asset_symbol === chain.unit;
            const isAssetTransfer = item.asset_symbol !== chain.unit;

            const action = isAssetTransfer ? 'assets(transfer)' : isNativeTransfer ? 'balances(transfer_allow_death)' : '';
            const newTransfers: Transfers = {
              hash: item.hash || '',
              status: item.success ? 'Success' : 'Fail',
              from: item.from || '',
              to: item.to || '',
              amount: item.amount || '0',
              token_symbol: item.asset_symbol || chain.unit,
              block_number: item.block_num || 0,
              action: action,
              fee: item.fee || '0',
              timestamp: item.block_timestamp || 0,
            };

            transfers.push(newTransfers);
          }
        }

        page += 1;
        hasMore = transfers.length < count;
      }
    }

    return transfers;
  }

  async fetchExtrinsics(address: string, chain: Chain): Promise<Extrinsics[]> {
    const extrinsics: Extrinsics[] = [];

    if (chain.scanner && chain.scanner.type === ScannerType.Subsquid) {

    }

    if (chain.scanner && chain.scanner.type === ScannerType.Subscan) {
      let page = 0;
      let row = 100;

      let hasMore = true;
      while (hasMore) {
        const body = {
          address: address,
          page: page,
          row: row,
        };

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'X-API-Key': '4d0c8ba32dde4a06bda83d52af49120f',
        });

        const response: any = await firstValueFrom(
          this.http.post(chain.scanner?.extrinsics_url || '', body, { headers })
        );

        const count = response.data.count;
        const extrinsicsData = response.data.extrinsics || [];

        if (extrinsicsData.length > 0) {
          for (const item of extrinsicsData) {
            const newTransfers: Extrinsics = {
              extrinsic_hash: item.extrinsic_hash || '',
              status: item.success ? 'Success' : 'Fail',
              block_number: item.block_num || 0,
              call_module: item.call_module || '',
              call_module_function: item.call_module_function || '',
              fee: item.fee || '0',
              timestamp: item.block_timestamp || 0,
            };

            extrinsics.push(newTransfers);
          }
        }

        page += 1;
        hasMore = extrinsics.length < count;
      }
    }

    return extrinsics;
  }
}
