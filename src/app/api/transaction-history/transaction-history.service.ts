import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
  TransactionHistory,
  TransactionHistoryStatus,
} from 'src/models/transaction-history.model';
import { Network } from 'src/models/network.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionHistoryService {
  private readonly API_KEY = '4d0c8ba32dde4a06bda83d52af49120f';

  private readonly SUBSCAN_API_KEYS: Record<string, string> = {
    'Xode - Polkadot': 'https://polkadot.api.subscan.io/api/v2/scan/transfers',
    // 'Asset Hub - Paseo': 'https://assethub-paseo.api.subscan.io/api/v2/scan/transfers',
    'Asset Hub - Polkadot': 'https://assethub-polkadot.api.subscan.io/api/v2/scan/transfers',
    // 'Asset Hub - Kusama': 'https://assethub-kusama.api.subscan.io/api/v2/scan/transfers',
  };

  private readonly SUBSCAN_API_KEYS_EXTRINSICS: Record<string, string> = {
    'Xode - Polkadot': 'https://polkadot.api.subscan.io/api/scan/extrinsic',
    // 'Asset Hub - Paseo': 'https://assethub-paseo.api.subscan.io/api/scan/extrinsic',
    'Asset Hub - Polkadot': 'https://assethub-polkadot.api.subscan.io/api/scan/extrinsic',
    // 'Asset Hub - Kusama': 'https://assethub-kusama.api.subscan.io/api/scan/extrinsic',
  };

  private readonly NATIVE_TOKENS: Record<string, string> = {
    'Xode - Polkadot': 'XON',
    // 'Asset Hub - Paseo': 'PAS',
    'Asset Hub - Polkadot': 'DOT',
    // 'Asset Hub - Kusama': 'KSM',
  };

  private readonly XODE_ENDPOINTS: Record<string, string> = {

  }

  constructor(private http: HttpClient) {}

  async fetchTransfers(
    address: string,
    network: Network
  ): Promise<TransactionHistory[]> {
    const transfersApiUrl = this.SUBSCAN_API_KEYS[network.name];
    const extrinsicsApiUrl = this.SUBSCAN_API_KEYS_EXTRINSICS[network.name];

    if (!transfersApiUrl || !extrinsicsApiUrl) {
      throw new Error('Unsupported network for fetching transactions.');
    }

    const nativeTokenSymbol = this.NATIVE_TOKENS[network.name] || '';
    const allTransfers: TransactionHistory[] = [];
    const seenHashes = new Set<string>();

    let page = 0;
    const rowsPerPage = 100;
    let hasMore = true;

    while (hasMore) {
      const body = { address, row: rowsPerPage, page };
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': this.API_KEY,
      });

      const res: any = await firstValueFrom(
        this.http.post(transfersApiUrl, body, { headers })
      );

      if (res.code !== 0) {
        throw new Error(res.message || 'Failed to fetch data');
      }

      const transfersPage = res.data.transfers || [];

      const transfersMapped: TransactionHistory[] = transfersPage.map(
        (item: any) => {
          const isNativeTransfer = item.asset_symbol === nativeTokenSymbol;
          const isAssetTransfer = Boolean(item.asset_symbol) && item.asset_symbol !== nativeTokenSymbol;

          const action = isAssetTransfer ? 'assets(transfer)'
            : isNativeTransfer ? 'balances(transfer_allow_death)'
            : item.action ?? 'unknown(transfer)';

          return {
            block_num: item.block_num,
            amount: item.amount,
            from: item.from,
            to: item.to,
            hash: item.hash,
            block_timestamp: item.block_timestamp,
            status: item.success === true
                ? TransactionHistoryStatus.Success
                : TransactionHistoryStatus.Fail,
            action,
            token_symbol: item.asset_symbol || nativeTokenSymbol || 'unknown',
          };
        }
      );

      for (const transfer of transfersMapped) {
        if (!seenHashes.has(transfer.hash)) {
          allTransfers.push(transfer);
          seenHashes.add(transfer.hash);
        }
      }

      page += 1;
      hasMore = transfersPage.length === rowsPerPage;
    }

    const fetchExtrinsic = async (transfer: TransactionHistory) => {
      if (!transfer.hash) return;
      try {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'X-API-Key': this.API_KEY
        });
        const body = { hash: transfer.hash };
        const extrinsicRes: any = await firstValueFrom(
          this.http.post(extrinsicsApiUrl, body, { headers })
        );
        if (extrinsicRes.code === 0 && extrinsicRes.data) {
          transfer.action = `${extrinsicRes.data.call_module}(${extrinsicRes.data.call_module_function})`;
        }
      } catch (_) {}
    }
    
    if (network.name === 'Asset Hub - Paseo') {
      await Promise.all(allTransfers.map(fetchExtrinsic));
    } else {
      for (const transfer of allTransfers) {
        await fetchExtrinsic(transfer);
        await new Promise((r) => setTimeout(r, 70));
      }
    }

    return allTransfers;
  }
}