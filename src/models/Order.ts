export interface IOrderItem {
  name: string;
  price: number;
}

export interface IOrder {
  id?: string;
  _id?: string;
  customerName: string;
  customerPhone?: string;
  items: IOrderItem[];
  totalAmount: number;
  advancePaid: number;
  paymentStep: number;
  status: "PARTIAL" | "COMPLETED";
  createdAt?: string | Date;
}