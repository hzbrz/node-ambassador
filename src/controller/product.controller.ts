import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
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