import { Request, Response } from "express"
import { getRepository } from "typeorm"
import { Order } from "../entity/order.entity"

export const Orders = async (req: Request, res: Response) => {
  // get all completed orders with 
  const orders = await getRepository(Order).find({
    where: { completed: true },
    // we have to specify the relation because of a one-to-many rel between order and order_items
    relations: ['order_items']
  })

  // arrow function shorthand of doing a return is just wrapping the object with a paren
  res.status(200).send(orders.map((order: Order) => (
    {
      id: order.id,
      name: order.name,
      email: order.email,
      total: order.total,
      created_at: order.created_at,
      order_items: order.order_items
    }
  )));
}