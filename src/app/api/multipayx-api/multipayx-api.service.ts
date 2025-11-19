import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

import { Price } from 'src/models/multipayx-api.model';
import { Payments } from 'src/models/transaction-history.model';
import { search } from 'ionicons/icons';
import { BankDetails } from 'src/models/pay.model';

@Injectable({
  providedIn: 'root'
})
export class MultipayxApiService {
  private readonly web3Url = 'https://web3-api.multipayx.net';
  private readonly rampApiUrl = 'https://ramp-api.multipayx.net';
  private readonly rampConfig = {
    access_key: "4A557D43A559A3B5959A7ED9EE5B7",
    secret_key: "44A6C686C46E4FBB11621E969931E",
    receive_address: "14mBB3gpUGA4SVYV8bxGf1c1LBjxwK54vdZKNUu9LAnXozCW",
  };
  private readonly currencyUrl = 'https://open.er-api.com/v6/latest/USD'

  constructor(
    private http: HttpClient
  ) { }

  async getPricePerToken(tokenSymbol: string): Promise<Price> {
    return await firstValueFrom(
      this.http.get<Price>(`${this.web3Url}/price/token/${tokenSymbol}`)
    );
  }

  async getPricePerCurrency(currencySymbol: string): Promise<Price> {
    return await firstValueFrom(
      this.http.get<Price>(`${this.web3Url}/price/currency/${currencySymbol}`)
    );
  }

  async fetchPayments(address: string): Promise<Payments[]> {
    const payments: Payments[] = [];

    try {
      const authResponse: any = await firstValueFrom(
        this.http.post(`${this.rampApiUrl}/authenticate`,
          JSON.stringify({
            access_key: this.rampConfig.access_key,
            secret_key: this.rampConfig.secret_key,
          }), {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
          })
        })
      );

      const token = authResponse.token;

      const paymentsResponse: any = await firstValueFrom(
        this.http.get(`${this.rampApiUrl}/xterium/byAddress`, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }),
          params: {
            search: address,
          }
        })
      );

      const paymentsData = paymentsResponse || [];
      if (paymentsData.length > 0) {
        for (const item of paymentsData) {
          const id = item._id || `${item.transactionHash || "no-hash"}-${item.createdAt || Date.now()}`;
          const fees = item.grossAmount && item.amount ? ((item.grossAmount - item.amount) / 100).toString() : undefined;

          let status: "pending" | "processing" | "completed" | "failed";
          switch (item.status) {
            case 0:
              status = "failed";
              break;
            case 1:
              status = item.transactionHash ? "completed" : "processing";
              break;
            case 2:
              status = "failed";
              break;
            case 3:
              status = item.statusMessage?.includes("Payout failed") ? "failed" : "completed";
              break;
            default: status = "pending";
          }

          const newPayments: Payments = {
            id: id,
            tx_hash: item.transactionHash,
            amount: (item.amount / 100).toString(),
            token_amount: item.tokenQuantity,
            token_symbol: item.token,
            merchant: item.destinationAccount?.bankName || "Ramp Service",
            status: status,
            timestamp: item.updatedAt || item.createdAt || new Date().toISOString(),
            account_identifier: item.destinationAccount?.accountNumber,
            account_name: item.destinationAccount?.recipientName,
            identifier_type: "account",
            bank_name: item.destinationAccount?.bankName,
            currency: item.currency || "PHP",
            fees: fees || '',
            gross_amount: item.grossAmount ? (item.grossAmount / 100).toString() : '',
            status_message: item.statusMessage,
            error: status === "failed" ? item.statusMessage : undefined,
            is_retried: item.isRetried,
          };

          payments.push(newPayments);
        }
      }
    } catch (error: any) {
      console.error('Network or unknown error:', error);
    }

    return payments;
  }

  async getBankCodeAndLogo(bankName: string): Promise<BankDetails[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.rampApiUrl}/payout-bank?pageSize=100`, {
          headers: {
            'accept': '*/*',
          },
        })
      );

      if (response?.success && response?.data?.result) {
        const filteredBanks: BankDetails[] = response.data.result.filter((bank: BankDetails) =>
          bank.bankName.toLowerCase().includes(bankName.toLowerCase())
        );

        return filteredBanks;
      }

      return [];
    } catch (error) {
      console.error('Error fetching bank details:', error);
      return [];
    }
  }

  async getCurrencyConversion(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.currencyUrl));

      if (response?.result === 'success' && response?.rates) {
        const rates = response.rates;

        const fromRate = rates[fromCurrency.toUpperCase()];
        const toRate = rates[toCurrency.toUpperCase()];

        if (fromRate === undefined || toRate === undefined) {
          throw new Error(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
        }

        const conversionRate = toRate / fromRate;
        return conversionRate;
      }

      throw new Error('Failed to fetch currency rates');
    } catch (error) {
      console.error('Error fetching currency conversion:', error);
      throw error;
    }
  }
}
