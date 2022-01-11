import { Request, Response } from 'express';
import { getRepository } from "typeorm"
import { Link } from "../entity/link.entity"

export const Links = async (req: Request, res: Response) => {
  const links = await getRepository(Link).find({
    // the Link entity expects an User object and the where clause is used to pass that as such
    where: {
      user: req.params.id
    },
    // if we want to get access to order or order_items from a link we can add it as a relation
    relations: ['orders', 'orders.order_items']
  });

  res.send(links);
}


export const CreateLink = async (req: Request, res: Response) => {
  // from the auth middleware
  const user = req['user']
  
  const link = await getRepository(Link).save({
    user,
    code: Math.random().toString(36).substring(6), // random 6 letter alphanumric string
     // an array of product id objects
    products: req.body.products.map(id => ({ id }) )
  })

  res.status(201).send(link);
}


// for each link ambassador has created we want to see how much revenue it has generated
export const Stats = async (req: Request, res: Response) => {
  const user = req['user']
  
  const links = await getRepository(Link).find({
    where: { user },
    // we will need these two for calculating revenue so we join
    relations: ['orders', 'orders.order_items']
  })

  res.send(links.map(link => {
    const orders = link.orders.filter(o => o.completed);

    return {
      code: link.code,
      count: orders.length,
      revenue: orders.reduce((sum, order) => sum + order.ambassador_revenue , 0)
    }
  }));
}