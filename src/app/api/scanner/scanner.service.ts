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
    private http: HttpClient,
  ) { }

  async fetchTransfers(address: string, chain: Chain, page: number, row: number): Promise<Transfers[]> {
    const transfers: Transfers[] = [];

    if (chain.scanner && chain.scanner.type === ScannerType.Subsquid) {
      if (chain.chain_id === 3417) {
        const skip = (page - 1) * row;

        const url = `${chain.scanner?.transfers_url}/transfer?limit=${row}&skip=${skip}&contains=${address}`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });

        const response: any = await firstValueFrom(
          this.http.get(url, { headers })
        );

        const blocks = response || [];

        for (const block of blocks) {
          const transferData = block.transfer || [];

          for (const item of transferData) {
            const isNativeTransfer = item.token === chain.unit;
            const isAssetTransfer = item.token !== chain.unit;

            const action = isAssetTransfer ? 'assets(transfer)' : isNativeTransfer ? 'balances(transfer_keep_alive)' : '';
            const timeStamp = item.timestamp || 0;

            const newTransfers: Transfers = {
              hash: item.hash || '',
              status: 'Success',
              from: item.from || '',
              to: item.to || '',
              amount: item.amount || '0',
              token_symbol: item.token || chain.unit,
              token_decimals: item.token_metadata ? item.token_metadata.decimals : null,
              block_number: block.blockNumber || 0,
              action: action,
              fee: item.fee || '0',
              timestamp: timeStamp,
            };

            transfers.push(newTransfers);
          }
        }
      }
    }

    if (chain.scanner && chain.scanner.type === ScannerType.Subscan) {
      const body = {
        address,
        page: page - 1,
        row: row
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': '4d0c8ba32dde4a06bda83d52af49120f',
      });

      const response: any = await firstValueFrom(
        this.http.post(chain.scanner?.transfers_url || '', body, { headers })
      );

      const transfersData = response.data.transfers || [];

      if (transfersData.length > 0) {
        for (const item of transfersData) {
          const isNativeTransfer = item.asset_symbol === chain.unit;
          const isAssetTransfer = item.asset_symbol !== chain.unit;

          const action = isAssetTransfer ? 'assets(transfer)' : isNativeTransfer ? 'balances(transfer_keep_alive)' : '';

          const rawTimestamp = item.block_timestamp || 0;
          const timeStamp = rawTimestamp * 1000;

          const newTransfers: Transfers = {
            hash: item.hash || '',
            status: item.success ? 'Success' : 'Fail',
            from: item.from || '',
            to: item.to || '',
            amount: item.amount || '0',
            token_symbol: item.asset_symbol || chain.unit,
            token_decimals: 0,
            block_number: item.block_num || 0,
            action: action,
            fee: item.fee || '0',
            timestamp: timeStamp,
          };

          transfers.push(newTransfers);
        }
      }
    }

    return transfers;
  }

  async fetchExtrinsics(address: string, chain: Chain, page: number, row: number): Promise<Extrinsics[]> {
    const extrinsics: Extrinsics[] = [];

    if (chain.scanner && chain.scanner.type === ScannerType.Subsquid) {
      if (chain.chain_id === 3417) {
        const skip = (page - 1) * row;

        const url = `${chain.scanner?.extrinsics_url}/extrinsics?limit=${row}&skip=${skip}&contains=${address}`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });

        const response: any = await firstValueFrom(
          this.http.get(url, { headers })
        );

        const blocks = response || [];

        for (const block of blocks) {
          const extrinsicsData = block.extrinsics || [];
          for (const item of extrinsicsData) {
            const timeStamp = item.timestamp || 0;

            const newTransfers: Extrinsics = {
              extrinsic_hash: item.txHash || '',
              status: item.success ? 'Success' : 'Fail',
              block_number: block.blockNumber || 0,
              call_module: item.section || '',
              call_module_function: item.method || '',
              fee: item.fee || 0,
              timestamp: timeStamp,
            };
            extrinsics.push(newTransfers);
          }
        }
      }
    }

    if (chain.scanner && chain.scanner.type === ScannerType.Subscan) {
      const body = {
        address,
        page: page - 1,
        row: row
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': '4d0c8ba32dde4a06bda83d52af49120f',
      });

      const response: any = await firstValueFrom(
        this.http.post(chain.scanner?.extrinsics_url || '', body, { headers })
      );

      const extrinsicsData = response.data.extrinsics || [];

      if (extrinsicsData.length > 0) {
        for (const item of extrinsicsData) {
          const rawTimestamp = item.block_timestamp || 0;
          const timeStamp = rawTimestamp * 1000;

          const newTransfers: Extrinsics = {
            extrinsic_hash: item.extrinsic_hash || '',
            status: item.success ? 'Success' : 'Fail',
            block_number: item.block_num || 0,
            call_module: item.call_module || '',
            call_module_function: item.call_module_function || '',
            fee: item.fee || '0',
            timestamp: timeStamp,
          };

          extrinsics.push(newTransfers);
        }
      }
    }

    return extrinsics;
  }
}
