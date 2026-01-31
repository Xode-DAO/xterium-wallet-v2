import { HexString } from "@polkadot/util/types";

export class SignerPayloadTransactionHex {
  address: string = "";
  genesis_hash: HexString = "0x";
  transaction_hex: HexString = "0x";
}
