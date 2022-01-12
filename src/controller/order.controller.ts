import { Request, Response } from "express"
import { getConnection, getRepository } from "typeorm"
import { Link } from "../entity/link.entity"
import { OrderItem } from "../entity/order-item.entity"
import { Order } from "../entity/order.entity"
import { Product } from "../entity/product.entity"

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

export const CreateOrder = async (req: Request, res: Response) => {
  const body = req.body;

  const link = await getRepository(Link).findOne({
    where: { code: body.code },
    relations: ['user']
  })

  if (!link)
    return res.status(400).send({ message: "Invalid Link" })

  // we cerate a database transaction because below we have a group of queries saving to the database and if 
  // something goes wrong we want them to not be inserted. Transactions make sure, with a group of queries 
  // we only insert when everything is successful otherwise we insert nothing. 
    // in a db transaction a query runner will help us run the queries instead of the normal getRepository
  const queryRunner = getConnection().createQueryRunner();

  try {
    // connect and start the transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let order = new Order();
    order.user_id = link.user.id;
    order.ambassador_email = link.user.email;
    order.code = body.code;
    order.first_name = body.first_name;
    order.last_name = body.last_name;
    order.email = body.email;
    order.address = body.address;
    order.country = body.country;
    order.city = body.city;
    order.zip = body.zip;

    // switching out the getRepository statement with queryRunner
    order = await queryRunner.manager.save(order);

    for (let p of body.products) {
      const product = await getRepository(Product).findOne(p.product_id);

      const orderItem = new OrderItem();
      orderItem.order = order;
      orderItem.product_title = product.title;
      orderItem.price = product.price;
      orderItem.quantity = p.quantity;
      orderItem.ambassador_revenue = 0.1 * (product.price * p.quantity) // ambassador gets 10% of the rev
      orderItem.admin_revenue = 0.9 * (product.price * p.quantity) // admin gets 90

      await queryRunner.manager.save(orderItem);

      // throw new Error();
    }
    // if there is no error we commit the transaction
    await queryRunner.commitTransaction();

    res.send(order);

  } catch (error) {
    // if there is an error we roll back the transaction
    await queryRunner.rollbackTransaction();
    return res.status(400).send({ message: "Error occured" })
  }
}