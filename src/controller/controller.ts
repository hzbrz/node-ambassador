import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entity/user.entity";
import { hash, compare } from 'bcryptjs';
import { sign, verify } from "jsonwebtoken";

export const Register = async (req: Request, res: Response) => {
  const {password, password_confirm, ...body} = req.body;
  if (password !== password_confirm) 
    return res.status(400).send({
      message: "Passwords do not match."
    })
  
  // deconstructing so we can isolate the password from the rest of fields, should not send pass in res
  const user = await getRepository(User).save({
    ...body,
    password: await hash(password, 10),
    is_ambassador: false
  })

  // so we do not send the password to the reponse
  delete user.password;

  res.send(user);
}

export const Login = async (req: Request, res: Response) => {
  const user = await getRepository(User).findOne({ email: req.body.email }, {
    select: ["id", "password"]  // manually select the password
  })

  // checking is user exists and is a valid email
  if (!user)
    return res.status(400).send({
      message: 'Invalid Credentials'
    })
  
  // validating password
  if (!await compare(req.body.password, user.password))
    return res.status(400).send({
      message: 'Invalid Credentials'
    })

  // creating a test token 
  const token = sign({
    id: user.id
  }, process.env.SECRET_KEY);


  // storing token in httpOnly cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    maxAge: 24*60*60*1000
  })

  res.send({ message: 'Success' });
}


export const AuthenticatedUser =  async (req: Request, res: Response) => {
  res.send(req['user']);
}

// Logout function we just need to remove the cookie authenticating the user
export const Logout =  async (req: Request, res: Response) => {
  // to delete a cookie, empty it and expire it with maxAge 0
  res.cookie('jwt', '', { maxAge: 0 });
  
  res.send({ message: 'Success' });
}