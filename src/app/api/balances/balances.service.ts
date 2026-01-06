import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BalancesService {
  formatBalance(amount: number, decimals: number): number {
    return amount / Math.pow(10, decimals);
  }

  formatBalanceWithSuffix(amount: number, decimals: number): string {
    const scaled = amount / Math.pow(10, decimals);

    let formatted: string;
    if (scaled >= 1_000_000_000_000) {
      formatted = (scaled / 1_000_000_000_000).toFixed(2) + " T";
    } else if (scaled >= 1_000_000_000) {
      formatted = (scaled / 1_000_000_000).toFixed(2) + " B";
    } else if (scaled >= 1_000_000) {
      formatted = (scaled / 1_000_000).toFixed(2) + " M";
    } else {
      formatted = scaled.toFixed(2);

      const parts = formatted.split(".");
      parts[0] = Number(parts[0]).toLocaleString();
      formatted = parts.join(".");
    }

    return `${formatted}`;
  }

  formatTotalAmount(amount: number): string {
    const absAmount = Math.abs(amount);

    if (absAmount >= 1e12) {
      return (amount / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    }
    if (absAmount >= 1e9) {
      return (amount / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (absAmount >= 1e6) {
      return (amount / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    }

    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  parseBalance(amount: number, decimals: number): number {
    const raw = amount * Math.pow(10, decimals);
    return Number(BigInt(Math.floor(raw)).toString());
  }
}
