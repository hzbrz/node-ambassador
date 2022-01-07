import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_title: string;

  @Column()
  price: number;

  @Column()
  quantity: number;

  // when the user buys a link with products the revenue is shared between the ambass. and admin 
  @Column()
  ambassador_revenue: number;
  
  @Column()
  admin_revenue: number

  // an order can have many items in it
  @ManyToOne(() => Order, order => order.order_items)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
