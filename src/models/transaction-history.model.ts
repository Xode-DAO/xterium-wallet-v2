export class PaymentHistory {
  date_time!: string;
  payment_type!: string;
  name!: string;
  token_symbol!: string;
  amount!: string;
  chain_id!: string;
}

export class Transfers {
  hash: string = "";
  status: string = "";
  from: string = "";
  to: string = "";
  amount: string = "";
  token_symbol: string = "";
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
