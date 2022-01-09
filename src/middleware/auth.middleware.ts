import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { getRepository } from "typeorm";
import { User } from "../entity/user.entity";


// this middleware will check if the user is authneticated
export const AuthMiddleware = async (req: Request, res: Response, next: Function) => {
  // this try-catch block is for the verify() func which throws an error after we delete the cookie in Logout
  // meaning the user has to Login after they Logout to re-authenticate
  try {
    const jwt = req.cookies['jwt'];
  
    // decrypted the signed token
    const payload: any = verify(jwt, process.env.SECRET_KEY);
    
    if (!payload) 
      return res.status(400).send({
        message: 'Not Authenticated'
      })

    // if some part of the path matches >= 0 then ambassador route otherwise -1 = admin route
    const is_ambassador = req.path.indexOf('api/ambassador') >= 0 

    const user = await getRepository(User).findOne(payload.id);

    // using the scope that is passed in the payload of the jwt we can now check what the role of the user is
    if ((is_ambassador && payload.scope !== 'ambassador') || (!is_ambassador && payload.scope !== 'admin'))
      return res.status(401).send({
        message: 'Unauthorized'
      });
    
    // passing the user from middleware to controller through the request
    req['user'] = user;

    // instead of sending a response we just move to the next function
    next();

  } catch (error) {
    return res.status(400).send({
      message: 'Not Authenticated'
    })
  }
}