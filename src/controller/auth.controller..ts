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
    // we distinguish between admin and ambssador register by checking the path of the API endpoint
    is_ambassador: req.path === '/api/ambassador/register'  // Admin = false, Ambassador = true
  })

  // so we do not send the password to the reponse
  delete user.password;

  res.send(user);
}

export const Login = async (req: Request, res: Response) => {
  const user = await getRepository(User).findOne({ email: req.body.email }, {
    select: ["id", "password", 'is_ambassador']  // specifying which fields to select with the query 
  })

  // checking is user exists and is a valid email
  if (!user)
    return res.status(400).send({
      message: 'Invalid Credentials'
    });
  
  // validating password
  if (!await compare(req.body.password, user.password))
    return res.status(400).send({
      message: 'Invalid Credentials'
    });


  const adminLogin = req.path === '/api/admin/login';

  // if the user is an ambssador the should be unauthorized to login to the Admin side
  if (user.is_ambassador && adminLogin) 
    return res.status(401).send({
      message: 'Unauthorized'
    });

    
  // creating a test token 
  const token = sign({
    id: user.id,
    scope: adminLogin ? 'admin' : 'ambassador'   // clarifying what type of user is authenticated
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

// lets the user update their info once they are authenticated
export const UpdateInfo = async (req: Request, res: Response) => {
  // accessing the user from the passed value of the authetication middleware
  const user = req['user'];

  const repository = getRepository(User);

  // we cannot catch the updated user because it does not get returned here
  await repository.update(user.id, req.body); 

  // we find again because the user values has changed form the one gotten
  // in the req body and we want to get the udpated values  
  res.send(await repository.findOne(user.id));
}

// let the user update their password once they are authenticated
export const UpdatePassword = async (req: Request, res: Response) => {
  const user = req['user'];

  if (req.body.password !== req.body.password_confirm) 
    return res.status(400).send({
      message: "Passwords do not match."
    });
  
  // update the password here
  await getRepository(User).update(user.id, {
    password: await hash(req.body.password, 10)
  });

  // only the password has changed and not the user so send the user because no need to send 
  // password with the response
  res.send(user);
}