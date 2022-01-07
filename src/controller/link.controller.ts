import { Request, Response } from 'express';
import { getRepository } from "typeorm"
import { Link } from "../entity/link.entity"

export const Links = async (req: Request, res: Response) => {
  const links = await getRepository(Link).find({
    // the Link entity expects an User object and the where clause is used to pass that as such
    where: {
      user: req.params.id
    }
  });

  res.send(links);
}