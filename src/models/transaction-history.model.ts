export class Payments {
  id: string = "";
  tx_hash: string = "";
  amount: string = "";
  token_amount: string = "";
  token_symbol: string = "";
  merchant: string = "";
  status: "pending" | "processing" | "failed" | "completed" = "pending";
  timestamp: string = "";
  account_identifier: string = "";
  account_name: string = "";
  identifier_type?: "phone" | "account" | "userid" = "account";
  bank_name: string = "";
  fees: string = "";
  gross_amount: string = "";
  currency: string = "";
  status_message: string = "";
  error: string = "";
  is_retried: boolean = false;
}

export class Transfers {
  hash: string = "";
  status: string = "";
  from: string = "";
  to: string = "";
  amount: string = "";
  token_symbol: string = "";
  token_decimals: number | null = null;
  block_number: number = 0;
  action: string = "";
  fee: string = "";
  timestamp: number = 0;
}

export class Extrinsics {
  extrinsic_hash: string = "";
  status: string = "";
  block_number: number = 0;
  call_module: string = "";
  call_module_function: string = "";
  fee: string = "";
  timestamp: number = 0;
}
