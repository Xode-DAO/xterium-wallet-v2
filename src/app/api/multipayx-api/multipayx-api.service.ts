import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

import { Price } from 'src/models/multipayx-api.model';

@Injectable({
  providedIn: 'root'
})
export class MultipayxApiService {
  private apiUrl = 'https://web3-api.multipayx.net';

  constructor(
    private http: HttpClient
  ) { }

  async getPricePerToken(tokenSymbol: string): Promise<Price> {
    return await firstValueFrom(
      this.http.get<Price>(`${this.apiUrl}/price/token/${tokenSymbol}`)
    );
  }

  async getPricePerCurrency(currencySymbol: string): Promise<Price> {
    return await firstValueFrom(
      this.http.get<Price>(`${this.apiUrl}/price/currency/${currencySymbol}`)
    );
  }
}
