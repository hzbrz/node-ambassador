import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entity/user.entity";
import { hash, compare } from 'bcryptjs';

export const Register = async (req: Request, res: Response) => {
  const body = req.body;
  if (body.password !== body.password_confirm) 
    return res.status(400).send({
      message: "Passwords do not match."
    })
  
  // deconstructing so we can isolate the password from the rest of fields, should not send pass in res
  const {password, ...user} = await getRepository(User).save({
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    password: await hash(body.password, 10),
    is_ambassador: false
  })

  res.send(user);
}

export const Login = async (req: Request, res: Response) => {
  const user = await getRepository(User).findOne({ email: req.body.email })

  // checking is user exists and is a valid email
  if (!user)
    return res.status(400).send({
      message: 'Invalid Credentials'
    })
  
  // checking if the correct pass is entered
  if (!await compare(req.body.password, user.password))
    return res.status(400).send({
      message: 'Invalid Credentials'
    })

  res.send(user);
}