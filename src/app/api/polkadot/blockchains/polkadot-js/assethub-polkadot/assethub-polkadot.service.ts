import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { cryptoWaitReady } from '@polkadot/util-crypto';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { hexToString, hexToU8a, } from '@polkadot/util';
import { ISubmittableResult } from '@polkadot/types/types';

import { PolkadotJsService } from 'src/app/api/polkadot/blockchains/polkadot-js/polkadot-js.service';
import { SettingsService } from 'src/app/api/settings/settings.service';

import { Token } from 'src/models/token.model';
import { Balance } from 'src/models/balance.model';
import { WalletSigner } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export class AssethubPolkadotService extends PolkadotJsService {

  constructor(
    private settingsService: SettingsService,
  ) {
    super();
  }

  async connect(): Promise<ApiPromise> {
    await cryptoWaitReady();

    const wsProvider = new WsProvider([
      "wss://asset-hub-polkadot-rpc.n.dwellir.com",
      "wss://statemint-rpc-tn.dwellir.com",
      "wss://sys.ibp.network/asset-hub-polkadot",
      "wss://asset-hub-polkadot.dotters.network",
      "wss://rpc-asset-hub-polkadot.luckyfriday.io",
      "wss://statemint.api.onfinality.io/public-ws",
      "wss://polkadot-asset-hub-rpc.polkadot.io",
      "wss://statemint.public.curie.radiumblock.co/ws",
      "wss://dot-rpc.stakeworld.io/assethub"
    ]);
    const api = await ApiPromise.create({ provider: wsProvider });

    return api;
  }

  async getTokens(api: ApiPromise): Promise<Token[]> {
    const tokens: Token[] = [];

    const systemChain = await api.rpc.system.chain();
    const systemProperties = (await api.rpc.system.properties()).toHuman();
    const balanceTotalIssuance = (await api.query['balances']['totalIssuance']()).toString();

    const xodeChainName = systemChain.toString();
    const xodeTokenSymbol = systemProperties['tokenSymbol'];
    const xodeTokenDecimals = systemProperties['tokenDecimals'];
    const xodeTotalTokenSupply = balanceTotalIssuance;

    const nativeToken: Token = {
      id: uuidv4(),
      reference_id: 0,
      chain_id: 2,
      name: xodeChainName,
      symbol: xodeTokenSymbol?.toString() ?? "",
      decimals: xodeTokenDecimals !== undefined ? Number(xodeTokenDecimals) : 0,
      total_supply: xodeTotalTokenSupply !== undefined ? BigInt(balanceTotalIssuance) : BigInt(0),
      type: "native",
      image: ""
    };

    tokens.push(nativeToken);

    const assetsAsset = await api.query['assets']['asset'].entries();
    assetsAsset.forEach(async ([{ args: [storageKey] }, data]) => {
      const assetId = storageKey.toHuman();
      const asset = JSON.parse(data.toString());

      const assetsMetadata = await api.query['assets']['metadata'](storageKey);
      const metadata = assetsMetadata.toJSON() as any;

      const assetToken: Token = {
        id: uuidv4(),
        reference_id: assetId?.toString().replace(/,/g, "") || "",
        chain_id: 2,
        name: hexToString(metadata.name),
        symbol: hexToString(metadata.symbol),
        decimals: Number(metadata.decimals),
        total_supply: BigInt(asset.supply.toString()),
        type: "asset",
        image: ""
      };

      tokens.push(assetToken);
    });

    return tokens;
  }

  async getExistentialDepositOfNativeToken(api: ApiPromise): Promise<number> {
    const existentialDeposit = api.consts['balances']['existentialDeposit'];
    return Number(existentialDeposit.toString());
  };

  async getMinimumBalanceOfAssetToken(api: ApiPromise, reference_id: number): Promise<number | null> {
    const assetId = reference_id;
    const assetsAsset = await api.query['assets']['asset'](assetId);
    const asset = assetsAsset.toJSON() as any;

    return Number(BigInt(asset.minBalance.toString()));
  };

  async getBalances(api: ApiPromise, tokens: Token[], publicKey: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    if (tokens.length > 0) {
      const assetBalances: Balance[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          if (token.type === 'native') {
            const systemAccount = await api.query['system']['account'](publicKey);
            const account = systemAccount.toJSON() as any;

            balances.push({
              id: uuidv4(),
              token,
              quantity: Number(account.data.free),
              price: 0,
              amount: 0,
            });
          } else {
            const assetId = token.reference_id;
            const assetsAccount = await api.query['assets']['account'](Number(assetId), publicKey);
            const account = assetsAccount.toJSON() as any;

            const settings = await this.settingsService.get();
            const isZeroBalancesHidden = settings?.user_preferences.hide_zero_balances ?? false;

            const balance = Number(account?.balance || 0);
            const shouldInclude = !isZeroBalancesHidden || balance > 0;

            if (shouldInclude) {
              assetBalances.push({
                id: uuidv4(),
                token,
                quantity: balance,
                price: 0,
                amount: 0,
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

  watchBalances(api: ApiPromise, tokens: Token[], publicKey: string): Observable<Balance[]> {
    return new Observable<Balance[]>(subscriber => {
      const subscriptions: any[] = [];
      const balances: Balance[] = [];

      (async () => {
        const balanceList = await Promise.all(
          tokens.map(async token => {
            if (token.type === 'native') {
              const systemAccount = await api.query['system']['account'](publicKey);
              const account = systemAccount?.toJSON() as any;

              return <Balance>{
                id: uuidv4(),
                token,
                quantity: Number(account.data.free),
                price: 0,
                amount: 0,
              };
            } else {
              const assetId = token.reference_id;
              const assetsAccount = await api.query['assets']['account'](Number(assetId), publicKey);
              const account = assetsAccount.toJSON() as any;

              const settings = await this.settingsService.get();
              const isZeroBalancesHidden = settings?.user_preferences.hide_zero_balances ?? false;

              const balance = Number(account?.balance || 0);
              const shouldInclude = !isZeroBalancesHidden || balance > 0;

              if (shouldInclude) {
                return <Balance>{
                  id: uuidv4(),
                  token,
                  quantity: balance,
                  price: 0,
                  amount: 0,
                };
              } else {
                return null;
              }
            }
          })
        );

        const newBalances = balanceList.filter((t): t is Balance => !!t);
        balances.splice(0, balances.length, ...newBalances);
        balances.sort((a, b) => Number(a.token.reference_id) - Number(b.token.reference_id))

        subscriber.next([...balances]);

        newBalances.forEach(async balance => {
          if (balance.token.type === 'native') {
            const systemAccountSubscription = await api.query['system']['account'](publicKey, (data: any) => {
              const account = data?.toJSON() as any;
              const idx = balances.findIndex(t => t.id === balance.id);

              if (idx >= 0) {
                balances[idx] = {
                  ...balances[idx],
                  quantity: Number(account.data.free),
                  price: 0,
                  amount: 0,
                };

                subscriber.next([...balances]);
              }
            });

            subscriptions.push(systemAccountSubscription);
          } else {
            const assetId = balance.token.reference_id;
            const assetAccountSubscription = await api.query['assets']['account'](Number(assetId), publicKey, (data: any) => {
              const account = data.toJSON() as any;

              if (account?.balance > 0) {
                const idx = balances.findIndex(t => t.id === balance.id);

                if (idx >= 0) {
                  balances[idx] = {
                    ...balances[idx],
                    quantity: Number(account.balance),
                  };

                  subscriber.next([...balances]);
                }
              }
            });

            subscriptions.push(assetAccountSubscription);
          }
        });
      })();

      return () => subscriptions.forEach(unsub => unsub());
    });
  }

  async getBalance(api: ApiPromise, token: Token, publicKey: string): Promise<Balance> {
    let balance: Balance = new Balance();

    if (token.type === 'native') {
      const systemAccount = await api.query['system']['account'](publicKey);
      const account = systemAccount.toJSON() as any;

      balance = {
        id: uuidv4(),
        token,
        quantity: Number(account.data.free),
        price: 0,
        amount: 0,
      };
    } else {
      const assetId = token.reference_id;
      const assetsAccount = await api.query['assets']['account'](Number(assetId), publicKey);
      const account = assetsAccount.toJSON() as any;

      if (account?.balance > 0) {
        balance = {
          id: uuidv4(),
          token,
          quantity: Number(account?.balance || 0),
          price: 0,
          amount: 0,
        };
      }
    }

    return balance;
  }

  watchBalance(api: ApiPromise, token: Token, publicKey: string): Observable<Balance> {
    return new Observable<Balance>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        if (token.type === 'native') {
          const systemAccountSubscription = await api.query['system']['account'](publicKey, (data: any) => {
            const account = data?.toJSON() as any;
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
        } else {
          const assetId = token.reference_id;
          const assetAccountSubscription = await api.query['assets']['account'](Number(assetId), publicKey, (data: any) => {
            const account = data.toJSON() as any;
            const newBalance: Balance = {
              id: uuidv4(),
              token,
              quantity: Number(account.balance),
              price: 0,
              amount: 0,
            };

            subscriber.next(newBalance);
          });

          subscriptions.push(assetAccountSubscription);
        }
      })();

      return () => subscriptions.forEach(unsub => unsub());
    });
  }

  async transfer(api: ApiPromise, balance: Balance, destPublicKey: string, value: number): Promise<string> {
    const bigIntAmount = BigInt(value);

    if (balance.token.type === 'native') {
      const transferExtrinsic = api.tx['balances']['transferKeepAlive'](
        destPublicKey,
        bigIntAmount
      );

      return transferExtrinsic.toHex();
    }

    const formattedAmount = api.createType(
      "Compact<u128>",
      bigIntAmount
    );

    const transferExtrinsic = api.tx['assets']['transferKeepAlive'](
      Number(balance.token.reference_id),
      destPublicKey,
      formattedAmount,
    );

    return transferExtrinsic.toHex();
  }

  async estimatedFees(api: ApiPromise, encodedCallDataHex: string, publicKey: string, token: Token | null): Promise<number> {
    const txBytes = hexToU8a(encodedCallDataHex);
    const call = api.createType('Extrinsic', txBytes);
    const tx = api.tx(call);

    const { partialFee } = await tx.paymentInfo(publicKey);

    return Number(BigInt(partialFee.toString()));
  }

  async signTransaction(api: ApiPromise, encodedCallDataHex: string, walletSigner: WalletSigner): Promise<string> {
    const publicKey = new Uint8Array(walletSigner.public_key.split(',').map(Number));
    const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));
  
    const keyring = new Keyring({ type: 'sr25519' });
    const pair = keyring.addFromPair({
      publicKey,
      secretKey,
    });
  
    const txBytes = hexToU8a(encodedCallDataHex);
    const call = api.createType('Extrinsic', txBytes);
    const tx = api.tx(call);
  
    const signedTx = await tx.signAsync(pair, { nonce: -1 });
  
    return signedTx.toHex();
  }
  
  signAndSubmitTransaction(api: ApiPromise, encodedCallDataHex: string, walletSigner: WalletSigner): Observable<ISubmittableResult> {
    return new Observable<ISubmittableResult>(subscriber => {
      const subscriptions: any[] = [];

      (async () => {
        const publicKey = new Uint8Array(walletSigner.public_key.split(',').map(Number));
        const secretKey = new Uint8Array(walletSigner.private_key.split(',').map(Number));

        const keyring = new Keyring({ type: 'sr25519' });
        const pair = keyring.addFromPair({
          publicKey,
          secretKey,
        });

        const txBytes = hexToU8a(encodedCallDataHex);
        const call = api.createType('Extrinsic', txBytes);
        const tx = api.tx(call);

        const txSignAndSendSubscription = await tx.signAndSend(pair, { nonce: -1 }, (data) => {
          subscriber.next(data);
        });

        subscriptions.push(txSignAndSendSubscription);
      })();

      return () => subscriptions.forEach(unsub => unsub());
    });
  }
}
