import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { hydrationPolkadot, MultiAddress } from "@polkadot-api/descriptors"
import { createClient, Transaction, TxEvent, InvalidTxError, Binary, HexString } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { sr25519 } from "@polkadot-labs/hdkd-helpers"
import { getPolkadotSigner } from "polkadot-api/signer"

import { Token, TokenPrice } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

import { PolkadotApiService } from '../polkadot-api.service';

@Injectable({
  providedIn: 'root'
})
export class HydrationService extends PolkadotApiService {
  protected wsProvider = "wss://hydration-rpc.n.dwellir.com";
  protected client = createClient(getWsProvider(this.wsProvider));
  protected chainApi = this.client.getTypedApi(hydrationPolkadot);

  async getTokens(): Promise<Token[]> {
    const xodeChainSpecs = this.client.getChainSpecData();

    const xodeChainName = (await xodeChainSpecs).name;
    const xodeTokenSymbol = (await xodeChainSpecs).properties['tokenSymbol'];
    const xodeTokenDecimals = (await xodeChainSpecs).properties['tokenDecimals'];
    const xodeTotalTokenSupply = Number(await this.chainApi.query.Balances.TotalIssuance.getValue({ at: "best" }))

    const tokens: Token[] = [];

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      chain_id: 2,
      name: xodeChainName,
      symbol: xodeTokenSymbol,
      decimals: xodeTokenDecimals,
      total_supply: xodeTotalTokenSupply,
      type: "native",
      image: ""
    }

    tokens.push(nativeToken);

    return tokens;
  }

  async getBalances(tokens: Token[], tokenPrices: TokenPrice[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          let price = 0;
          if (tokenPrices.length > 0) {
            price = tokenPrices.find(p => p.token.id === token.id)?.price || 0;
          }

          const balanceAccount = await this.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
          balances.push({
            id: uuidv4(),
            token,
            quantity: Number(balanceAccount.data.free),
            price,
            amount: Number(balanceAccount.data.free) * price,
          });
        })
      );

      assetBalances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));
      balances.push(...assetBalances);
    }

    return balances;
  }

  watchTokens(): Observable<Token[]> {
    return new Observable<Token[]>(subscriber => {
      const subscriptions: any[] = [];
      const tokens: Token[] = [];

      (async () => {
        const assethubChainSpecs = this.client.getChainSpecData();

        const assethubChainName = (await assethubChainSpecs).name;
        const assethubTokenSymbol = (await assethubChainSpecs).properties['tokenSymbol'];
        const assethubTokenDecimals = (await assethubChainSpecs).properties['tokenDecimals'];
        const assethubTotalTokenSupply = Number(await this.chainApi.query.Balances.TotalIssuance.getValue({ at: "best" }));

        tokens.push({
          id: uuidv4(),
          reference_id: 0,
          chain_id: 1,
          name: assethubChainName,
          symbol: assethubTokenSymbol,
          decimals: assethubTokenDecimals,
          total_supply: assethubTotalTokenSupply,
          type: "native",
          image: ""
        });

        subscriber.next([...tokens]);

        const totalIssuanceSub = this.chainApi.query.Balances.TotalIssuance
          .watchValue("best")
          .subscribe(totalIssuance => {
            const idx = tokens.findIndex(t => t.type === "native");
            if (idx >= 0) {
              tokens[idx] = {
                ...tokens[idx],
                total_supply: Number(totalIssuance)
              };

              subscriber.next([...tokens]);
            }
          });

        subscriptions.push(totalIssuanceSub);
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  watchBalances(tokens: Token[], tokenPrices: TokenPrice[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            let price = 0;
            if (tokenPrices.length > 0) {
              price = tokenPrices.find(p => p.token.symbol.toLowerCase() === token.symbol.toLowerCase())?.price || 0;
            }

            const balanceAccount = await this.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
            return <Balance>{
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
              price,
              amount: Number(balanceAccount.data.free) * price,
            };
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id))

        subscriber.next([...balances]);

        newBalances.forEach(balance => {
          let price = 0;
          if (tokenPrices.length > 0) {
            price = tokenPrices.find(p => p.token.symbol.toLowerCase() === balance.token.symbol.toLowerCase())?.price || 0;
          }

          const systemAccountSubscription = this.chainApi.query.System.Account
            .watchValue(publicKey, "best")
            .subscribe(account => {
              const idx = balances.findIndex(t => t.id === balance.id);

              if (idx >= 0) {
                balances[idx] = {
                  ...balances[idx],
                  quantity: Number(account.data.free),
                  price,
                  amount: Number(account.data.free) * price,
                };

                subscriber.next([...balances]);
              }
            });

          subscriptions.push(systemAccountSubscription);
        });
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  watchBalance(balance: Balance, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      const systemAccountSubscription = this.chainApi.query.System.Account
        .watchValue(publicKey, "best")
        .subscribe(account => {
          const newBalance: Balance = {
            id: balance.id,
            token: balance.token,
            quantity: Number(account.data.free),
            price: balance.price,
            amount: Number(account.data.free) * balance.price,
          };

          subscriber.next(newBalance);
        });

      subscriptions.push(systemAccountSubscription);

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  transfer(balance: Balance, destPublicKey: string, value: number): Transaction<any, any, any, void | undefined> {
    const bigValue = BigInt(value);

    return this.chainApi.tx.Balances.transfer_allow_death({
      dest: destPublicKey,
      value: bigValue,
    });
  }

  async decodeCallData(encodedCallDataHex: string): Promise<Transaction<any, any, any, void | undefined>> {
    const binary = Binary.fromHex(encodedCallDataHex);
    const transaction = await this.chainApi.txFromCallData(binary);
    return transaction;
  }

  signAndSubmitTransaction(encodedCallDataHex: HexString, walletSigner: WalletSigner): Observable<TxEvent> {
    return new Observable<TxEvent>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        const binary = Binary.fromHex(encodedCallDataHex);
        const transaction = await this.chainApi.txFromCallData(binary);

        const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));
        const signer = getPolkadotSigner(
          sr25519.getPublicKey(secretKey),
          "Sr25519",
          (input) => sr25519.sign(input, secretKey),
        );

        const signTransactionSubscription = transaction
          .signSubmitAndWatch(signer)
          .subscribe({
            next: (event: TxEvent) => {
              subscriber.next(event);
            },
            error(err: InvalidTxError) {
              subscriber.error(err);
            },
          });

        subscriptions.push(signTransactionSubscription);
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }
}
