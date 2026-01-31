import { Token } from "src/models/token.model";

export class Balance {
  id: string = "";
  token: Token = new Token();
  quantity: number = 0;
  price: number = 0;
  amount: number = 0;
  status: string = "";
}
