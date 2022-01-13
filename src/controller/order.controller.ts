import { Request, Response } from "express"
import { createTransport } from "nodemailer"
import { Stripe } from "stripe"
import { getConnection, getRepository } from "typeorm"
import { client } from ".."
import { Link } from "../entity/link.entity"
import { OrderItem } from "../entity/order-item.entity"
import { Order } from "../entity/order.entity"
import { Product } from "../entity/product.entity"
import { User } from "../entity/user.entity"

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

    // product fed to stripe for processing, array of objects with info about each product
    const line_items = []

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

      // setup the product as how stripe wants it and adding it the line_items arr
      line_items.push({
        name: product.title,
        description: product.description,
        images: [product.image],
        amount: 100*product.price,   // stripe needs amount in cents
        currency: 'usd',
        quantity: p.quantity
      })
    }

    // stripe init
    const stripe = new Stripe(process.env.STRIPE_SECRET, {
      apiVersion: '2020-08-27'
    });

    // configure stripe 
    const source = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      // the line_items arr carrying the products that will be processed
      line_items,
      // url needs to be gotten from env because it will change from local to prod when hosted...
        // CHECKOUT_SESSION_ID from the source query will be used to confirm an order
      success_url: `${process.env.CHECKOUT_URL}/success?source={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CHECKOUT_URL}/error`
    })

    // every order will have a transaction_id related stripe giving us the further capability to check any error
    // related to a sepcific order
    order.transaction_id = source['id'];
    // and we save it again after filling the transaction_id
    await queryRunner.manager.save(order);

    // if there is no error we commit the transaction
    await queryRunner.commitTransaction();

    // returning stripe's response
    res.send(source);

  } catch (error) {
    // if there is an error we roll back the transaction
    await queryRunner.rollbackTransaction();
    return res.status(400).send({ message: "Error occured", error })
  }
}

export const ConfirmOrder = async (req: Request, res: Response) => {
  const repository = getRepository(Order);

  const order = await repository.findOne({
    where: { transaction_id: req.body.source },
    relations: ['order_items']
  });

  if (!order)
    return res.status(404).send({ message: "Order Not Found!" })

  // if the transaction_id is the same as the one we get from source we just confirm it by setting completed
    // the source passed in req.body here is gotten from the url returned by stripe CHECKOUT_SESSION_ID
  await repository.update(order.id, { completed: true });

  const user = await getRepository(User).findOne(order.user_id);

  // when we complete an order the ambassador revenue will change so we increment the rankings
  await client.zIncrBy('rankings', order.ambassador_revenue, user.name);

  // setup a transporter to send emails using nodemailer
    // need to connect to address of the internal app running on docker
    // port gotten from mailhog
  const transporter = createTransport({
    host: 'host.docker.internal',
    port: 1025
  });

  // admin email
  await transporter.sendMail({
    from: 'from@example.com',
    to: 'admin@admin.com',
    subject: 'An order has been completed',
    html: `Order #${order.id} with total of $${order.total} has been completed`
  });
  // ambassador email
  await transporter.sendMail({
    from: 'from@example.com',
    to: order.ambassador_email,
    subject: 'An order has been completed',
    html: `You earned $${order.ambassador_revenue} from the link ${order.code}`
  });

  transporter.close();
  
  res.send({ message: 'Success' });
}