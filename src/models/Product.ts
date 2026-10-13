export interface IProduct {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  price: number;
  type?: string;
  createdAt?: string | Date;
}
