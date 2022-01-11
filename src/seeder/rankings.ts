import { createClient } from "redis";
import { createConnection, getRepository } from "typeorm";
import { Order } from "../entity/order.entity";
import { User } from "../entity/user.entity";


// we use redis sorted-sets to give us a descending sorted list of ambassadors based on their revenue
createConnection().then(async () => {

  const client = createClient({
    url: 'redis://redis:6379'
  });
  
  await client.connect()
  
  const ambassadors = await getRepository(User).find({
    is_ambassador: true
  });

  const orderRepository = getRepository(Order);

  for (let i = 0; i < ambassadors.length; i++) {
    const orders = await orderRepository.find({
      where: {
        user_id: ambassadors[i].id,
        completed: true
      },
      relations: ['order_items']
    })

    const revenue = orders.reduce((sum, order) => sum + order.ambassador_revenue, 0);

    // for each ambassador we add their name as value and revenue as a score — which will be used to sort.
    // We store this in the 'rankings' key in a sorted set using zAdd which we will access 
    // using ZREVRANGEBYSCORE from redis
    await client.zAdd('rankings', {
      value: ambassadors[i].name,
      score: revenue
    })
  }

  process.exit();
});