import { Request, Response } from "express";

export const Register = (req: Request, res: Response) => {
  const body = req.body;
  if (body.password !== body.password_confirm) 
    return res.status(400).send({
      message: "Passwords do not match."
    })
  res.send(req.body);
}

export const ShowOrders = (req: Request, res: Response) => {
  res.send('HELLO THERE');
}