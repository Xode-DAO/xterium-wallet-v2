export class TransactionHistory {
  block_num!: number
  amount!: string
  from!: string
  to!: string
  hash!: string
  block_timestamp!: string
  status?: TransactionHistoryStatus
  action?: string
  token_symbol?: string
}

export enum TransactionHistoryStatus {
  Success = 'Success',
  Fail = 'Fail',
  Finalized = 'Finalized',
}
