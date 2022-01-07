import { createConnection, getRepository } from "typeorm";
import * as faker from "faker";
import { randomInt } from "crypto";
import { Link } from "../entity/link.entity";
import { User } from "../entity/user.entity";
// import { Product } from "../entity/product.entity";

createConnection().then(async () => {
  const repository = getRepository(Link);

  // need to get all users because a deleted user will have no id and no_reference_row error
  const users = await getRepository(User).find();

  for (let i = 0; i < users.length; i++) {
    // const product = new Product();
    // product.price = randomInt(1, 30);

    await repository.save({
      code: faker.random.alphaNumeric(6),
      user: users[i],
      price: [randomInt(1,30)]  // me: product: [product] 
    });
  }

  process.exit();
});