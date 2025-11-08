import { Token } from "src/models/token.model";

export class Price {
  id: string = "";
  token: Token = new Token();
  price: number = 0;
}
