export class USDTTokenDetails {
  token_symbol: string = "USDT"
  amount: number = 0;
  price: number = 0;
}

export class PayDetails {
  recipient_name: string = "";
  account_number: string = "";
  amount: number = 0;
  bank_swift: string = "";
  bank_name: string = "";
  bank_code: string = "";
  bank_icon: string = "";
}

export class BankDetails {
  bankCode: string = "";
  bankName: string = "";
  accountLength: number = 0;
  bankIcon: string = "";
  fees: number = 0;
}