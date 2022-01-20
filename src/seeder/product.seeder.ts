import { createConnection, getRepository } from "typeorm";
import faker from 'faker';
import { Product } from "../entity/product.entity";
import { randomInt } from "crypto";
import fetch from 'cross-fetch';

createConnection().then(async () => {
  const repository = getRepository(Product);

  // make 30 products
  for (let i = 0; i <30; i++) {
    const img_res = await fetch(`https://source.unsplash.com/200x200/?${faker.random.words(2)}`);
    let url = img_res.url;
    if (url.indexOf('/source-404?')>=0){
      const err_img_res = await fetch('https://source.unsplash.com/200x200/?product');
      url = err_img_res.url;
    }
    await repository.save({
      title: faker.lorem.words(2),
      description: faker.lorem.words(10),
      image: url,  // randomize parameter set to true for different images
      price: randomInt(10, 100)
    })    
  }


  // exit the command once it is executed
  process.exit();
});