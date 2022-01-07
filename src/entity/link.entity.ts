import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { User } from "./user.entity";

@Entity()
export class Link{
  @PrimaryGeneratedColumn()
  id: number;

  // cannot have the same link for two different products so unique
  @Column({ unique: true })
  code: string;

  // an user can have many links
  @ManyToOne(() => User)
  // customize the referenced column's name
  @JoinColumn({ name: 'user_id' })
  user: User;

  // a link can have multiple products and a product can have multiple links
  @ManyToMany(() => Product)
  // many-to-many rel. need a middleman table to make the connection, typeorm does it using Jointable dec. 
  @JoinTable({
    name: 'link_products',
    joinColumn: { name: 'link_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' }
  })
  product: Product[];
}