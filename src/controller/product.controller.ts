import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { client } from '..';
import { Product } from '../entity/product.entity';

export const Products = async (req: Request, res: Response) => {
  res.status(200).send(await getRepository(Product).find());
}

export const CreateProduct = async (req: Request, res: Response) => {
  // 201 for create
  res.status(201).send(await getRepository(Product).save(req.body));
}

export const GetProduct = async (req: Request, res: Response) => {
  // req.params has access to the url parameters host/api/admin/products/{params}
  res.status(200).send(await getRepository(Product).findOne(req.params.id));
}

export const UpdateProduct = async (req: Request, res: Response) => {
  const repositorty = getRepository(Product);

  // update with id from the param  the body from the request (update function does not return updated product)
  await repositorty.update(req.params.id, req.body);

  // 202 for update
  res.status(202).send(await repositorty.findOne(req.params.id));
}

export const DeleteProduct = async (req: Request, res: Response) => {
  await getRepository(Product).delete(req.params.id);

  // satus 204 (no content) is used for delete
  res.status(204).send(null);
}

// ambassador endpoint to get all products 
export const ProdcutsFrontend = async (req: Request, res: Response) => {

  // we retrieve the products from the cache 
  let products = JSON.parse(await client.get('products_frontend'));
  
  // if we are able to retrieve products from the cache we skip this cond., we do not query the db and return
  // the res with cached products. Otherwise, if the products cache expires or it does not exist 
  // we query the db and set it in the cache and return them in the res.
  if (!products) {
    products = await getRepository(Product).find();
    // caching products by setting a key and value in redis 
    await client.set('products_frontend', JSON.stringify(products), {
      EX: 1800 // Expires in 1800 seconds ie. caching it for 30 minutes
    })
  }
  
  res.status(200).send(products);
}

// backend Searching, Sorting and Pagination
export const ProdcutsBackend = async (req: Request, res: Response) => {

  // explicitly defining the type here so we can use the filter function
  let products: Product[] = JSON.parse(await client.get('products_frontend'));

  if (!products) {
    products = await getRepository(Product).find();
    await client.set('products_frontend', JSON.stringify(products), {
      EX: 1800 // Expires in 1800 seconds ie. caching it for 30 minutes
    })
  }

  // 's' comes from the url after the '?', checking if there is a query
  if (req.query.s) {
    // getting the query value of s and we want the search to be case insensitive
    const s = req.query.s.toString().toLowerCase();

    // filtering the products based on whether the title or description of a product has 's' 
    products = products.filter(p => p.title.toLowerCase().indexOf(s) >= 0 || 
                               p.description.toLowerCase().indexOf(s) >= 0)
  }
  
  // ascending sort on prices of products
  if (req.query.sort === 'asc') {
    // js sort function 
    products.sort((a, b) => {
      // return val = 0 means keep original sort order of a and b
      if (a.price === b.price) return 0;

      // return val = -1 means sort a before b, this condition is key on how the array will be sorted
      if (a.price < b.price) return -1;

      // return val = 1 means sort b before a
      return 1;
    })
  } else if (req.query.sort === 'desc') {
    // descending sort 
    products.sort((a, b) => (a.price < b.price) ? 1 : (a.price > b.price) ? -1 : 0);
  }

  // pagination
  const page: number = parseInt(req.query.page as any) || 1;   // get page query if not set we assume 1
  const perPage = 9;  // per page want to show 9 products
  const total = products.length;   // total number of products

  // slice the product by 9 products per page. Lets assume '?page=1' we would slice products array (0,9)
  // '?page=2' (9, 18). This is backend pagination.
  const data = products.slice((page-1) * perPage, page * perPage);

  // array of products
  res.status(200).send({
    data,
    total,
    page,
    // Math.ceil does int division to find the last page. If we have 18 items total then 2 pages also if we 
    // 15 items then 2 pages because of ceil
    last_page: Math.ceil(total/perPage)
  });
}