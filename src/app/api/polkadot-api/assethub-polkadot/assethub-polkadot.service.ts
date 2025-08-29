import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
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

  getTokensObservable(): Observable<Token[]> {
    return new Observable<Token[]>(subscriber => {
      const subscriptions: any[] = [];
      const tokens: Token[] = [];

      (async () => {
        const assethubChainSpecs = this.client.getChainSpecData();

        const assethubChainName = (await assethubChainSpecs).name;
        const assethubTokenSymbol = (await assethubChainSpecs).properties['tokenSymbol'];
        const assethubTokenDecimals = (await assethubChainSpecs).properties['tokenDecimals'];
        const assethubTotalTokenSupply = Number(await this.assethubApi.query.Balances.TotalIssuance.getValue())

        tokens.push({
          id: uuidv4(),
          reference_id: 0,
          network_id: 1,
          name: assethubChainName,
          symbol: assethubTokenSymbol,
          decimals: assethubTokenDecimals,
          total_supply: assethubTotalTokenSupply,
          type: "native",
          image: ""
        });

        subscriber.next([...tokens]);

        const totalIssuanceSub = this.assethubApi.query.Balances.TotalIssuance
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

        const assetsSubscription = this.assethubApi.query.Assets.Asset
          .watchEntries({ at: "best" })
          .subscribe(async assets => {
            const assetList = await Promise.all(
              assets.entries.map(async entry => {
                const assetId = entry.args[0];
                if (!assetId) return null;

                const metadata = await this.assethubApi.query.Assets.Metadata.getValue(assetId);
                return <Token>{
                  id: uuidv4(),
                  reference_id: assetId,
                  network_id: 1,
                  name: metadata.name.asText(),
                  symbol: metadata.symbol.asText(),
                  decimals: metadata.decimals,
                  total_supply: Number(entry.value.supply),
                  type: "asset",
                  image: ""
                };
              })
            );

            const newAssets = assetList.filter((t): t is Token => !!t);

            const nativeOnly = tokens.filter(t => t.type === "native");
            tokens.splice(0, tokens.length, ...nativeOnly, ...newAssets);

            subscriber.next([...tokens]);

            newAssets.forEach(asset => {
              const metaSubscription = this.assethubApi.query.Assets.Metadata
                .watchValue(Number(asset.reference_id), "best")
                .subscribe(metadata => {
                  const idx = tokens.findIndex(t => t.id === asset.id);
                  if (idx >= 0) {
                    tokens[idx] = {
                      ...tokens[idx],
                      name: metadata.name.asText(),
                      symbol: metadata.symbol.asText(),
                      decimals: metadata.decimals
                    };

                    subscriber.next([...tokens]);
                  }
                });

              subscriptions.push(metaSubscription);
            });
          });

        subscriptions.push(assetsSubscription);
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  getBalancesObservable(tokens: Token[], tokenPrices: TokenPrices[], publicKey: string): Observable<Balance[]> {
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

            if (token.type === 'native') {
              const balanceAccount = await this.assethubApi.query.System.Account.getValue(publicKey);
              return <Balance>{
                id: token.id,
                token,
                quantity: Number(balanceAccount.data.free),
                price,
                amount: Number(balanceAccount.data.free) * price,
              };
            } else {
              const assetId = token.reference_id;

              const account = await this.assethubApi.query.Assets.Account.getValue(Number(assetId), publicKey);
              if (!account) return null;

              return <Balance>{
                id: token.id,
                token,
                quantity: Number(account.balance),
                price,
                amount: Number(account.balance) * price,
              };
            }
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));

        subscriber.next([...balances]);

        newBalances.forEach(balance => {
          let price = 0;
          if (tokenPrices.length > 0) {
            price = tokenPrices.find(p => p.token.symbol.toLowerCase() === balance.token.symbol.toLowerCase())?.price || 0;
          }

          if (balance.token.type === 'native') {
            const systemAccountSubscription = this.assethubApi.query.System.Account
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
          } else {
            const assetId = balance.token.reference_id;
            const assetAccountSubscription = this.assethubApi.query.Assets.Account
              .watchValue(Number(assetId), publicKey, "best")
              .subscribe(account => {
                if (account && Number(account.balance) > 0) {
                  const idx = balances.findIndex(t => t.id === balance.id);
                  if (idx >= 0) {
                    balances[idx] = {
                      ...balances[idx],
                      quantity: Number(account.balance),
                      price,
                      amount: Number(account.balance) * price,
                    };

                    subscriber.next([...balances]);
                  }
                }
              });

            subscriptions.push(assetAccountSubscription);
          }
        });
      })();

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }
}
