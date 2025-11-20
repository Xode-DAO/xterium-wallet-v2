import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Polkadot, polkadot, MultiAddress } from "@polkadot-api/descriptors"
import { createClient, TxEvent, InvalidTxError, Binary, HexString } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';
import { sr25519 } from "@polkadot-labs/hdkd-helpers"
import { getPolkadotSigner } from "polkadot-api/signer"

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

import { Api, PolkadotApiService } from 'src/app/api/polkadot/blockchains/polkadot-api/polkadot-api.service';

@Injectable({
  providedIn: 'root'
})
export class PolkadotService extends PolkadotApiService {
  async connect(): Promise<Api<Polkadot>> {
    const initClient = createClient(getWsProvider([
      "light://substrate-connect/polkadot",
      "wss://polkadot-rpc.publicnode.com",
      "wss://polkadot-public-rpc.blockops.network/ws",
      "wss://polkadot-rpc.n.dwellir.com",
      "wss://polkadot-rpc-tn.dwellir.com",
      "wss://rpc-polkadot.helixstreet.io",
      "wss://rpc.ibp.network/polkadot",
      "wss://polkadot.dotters.network",
      "wss://rpc-polkadot.luckyfriday.io",
      "wss://polkadot.api.onfinality.io/public-ws",
      "wss://polkadot.rpc.permanence.io",
      "wss://polkadot.public.curie.radiumblock.co/ws",
      "wss://spectrum-03.simplystaking.xyz/cG9sa2Fkb3QtMDMtOTFkMmYwZGYtcG9sa2Fkb3Q/LjwBJpV3dIKyWQ/polkadot/mainnet/",
      "wss://dot-rpc.stakeworld.io",
      "wss://polkadot.rpc.subquery.network/public/ws",
    ]));

    return {
      client: initClient,
      chainApi: initClient.getTypedApi(polkadot)
    }
  }

  async getTokens(api: Api<Polkadot>): Promise<Token[]> {
    const xodeChainSpecs = api.client.getChainSpecData();

    const xodeChainName = (await xodeChainSpecs).name;
    const xodeTokenSymbol = (await xodeChainSpecs).properties['tokenSymbol'];
    const xodeTokenDecimals = (await xodeChainSpecs).properties['tokenDecimals'];
    const xodeTotalTokenSupply = BigInt(await api.chainApi.query.Balances.TotalIssuance.getValue({ at: "best" }))

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

  async getBalances(api: Api<Polkadot>, tokens: Token[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
          balances.push({
            id: uuidv4(),
            token,
            quantity: Number(balanceAccount.data.free),
            price: 0,
            amount: 0,
          });
        })
      );

      assetBalances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id));
      balances.push(...assetBalances);
    }

    return balances;
  }

  watchBalances(api: Api<Polkadot>, tokens: Token[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
            return <Balance>{
              id: uuidv4(),
              token,
              quantity: Number(balanceAccount.data.free),
            };
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id))

        subscriber.next([...balances]);

        newBalances.forEach(balance => {
          const systemAccountSubscription = api.chainApi.query.System.Account
            .watchValue(publicKey, "best")
            .subscribe(account => {
              const idx = balances.findIndex(t => t.id === balance.id);

              if (idx >= 0) {
                balances[idx] = {
                  ...balances[idx],
                  quantity: Number(account.data.free),
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

  async getBalance(api: Api<Polkadot>, token: Token, publicKey: string): Promise<Balance> {
    const balanceAccount = await api.chainApi.query.System.Account.getValue(publicKey, { at: "best" });
    const balance = {
      id: uuidv4(),
      token,
      quantity: Number(balanceAccount.data.free),
      price: 0,
      amount: 0,
    };

    return balance;
  }

  watchBalance(api: Api<Polkadot>, token: Token, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      const systemAccountSubscription = api.chainApi.query.System.Account
        .watchValue(publicKey, "best")
        .subscribe(account => {
          const newBalance: Balance = {
            id: uuidv4(),
            token,
            quantity: Number(account.data.free),
            price: 0,
            amount: 0,
          };

          subscriber.next(newBalance);
        });

      subscriptions.push(systemAccountSubscription);

      return () => subscriptions.forEach(s => s.unsubscribe());
    });
  }

  async transfer(api: Api<Polkadot>, balance: Balance, destPublicKey: string, value: number): Promise<HexString> {
    const bigValue = BigInt(value);

    const transferExtrinsic = api.chainApi.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(destPublicKey),
      value: bigValue,
    });

    return (await transferExtrinsic.getEncodedData()).asHex()
  }

  signAndSubmitTransaction(api: Api<Polkadot>, encodedCallDataHex: HexString, walletSigner: WalletSigner): Observable<TxEvent> {
    return new Observable<TxEvent>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        const binary = Binary.fromHex(encodedCallDataHex);
        const transaction = await api.chainApi.txFromCallData(binary);

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
