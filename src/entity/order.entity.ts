import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  transaction_id: string;

  // denormalizing: adding precomputed important columns such as user's id and link code for easier read/query 
  @Column()
  user_id: number;

  @Column()
  code: string;

  @Column()
  ambassador_email: string;

  // following fields are for user who buys the product, different from the ambassador fields above
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string

  @Column({ nullable: true })
  address: string

  @Column({ nullable: true })
  country: string

  @Column({ nullable: true })
  city: string

  @Column({ nullable: true })
  zip: string

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  created_at: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  order_items: OrderItem[];

  // a typescript getter functions
  get name(): string{
    return this.first_name + ' ' + this.last_name;
  }

  // getting total admin revenue 
  get total(): number {
    // reduce returns an accumulated val of a previous val(sum) and the current val(item)
    return this.order_items.reduce((sum, item) => sum + item.admin_revenue, 0); // 0 is the initial value
  }
}
