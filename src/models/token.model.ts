export class Token {
  id: string = "";
  reference_id: string | number = "";
  network_id: number = 0;
  name: string = "";
  symbol: string = "";
  decimals: number = 0;
  total_supply: number = 0;
  type: string = "native";
  image: string = "";
}

export class TokenPrice {
  token: Token = new Token();
  price: number = 0;
}
