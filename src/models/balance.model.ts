import { Token } from "./token.model";

export class Balance {
  id: string = "";
  token: Token | null = null;
  quantity: number = 0;
  price: number = 0;
  amount: number = 0;
}
