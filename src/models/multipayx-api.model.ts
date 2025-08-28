export class Price {
  success: boolean = false;
  data: {
    id: string;
    symbol: string;
    currency: string;
    price: number;
  }[] = []
}
