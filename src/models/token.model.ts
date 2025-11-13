export class Token {
  id: string = "";
  reference_id: string | number = "";
  chain_id: number = 0;
  name: string = "";
  symbol: string = "";
  decimals: number = 0;
  total_supply: BigInt | string = BigInt(0);
  type: string = "native";
  image: string = "";
}
