import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { client } from '..';
import { Order } from '../entity/order.entity';
import { User } from '../entity/user.entity';

export const Ambassadors = async (req: Request, res: Response) => {
  res.send(await getRepository(User).find({
    is_ambassador: true
  }));
}


// getting the ranking of ambassadors based on their revenue from highest to lowest  
export const Rankings = async (req: Request, res: Response) => {
  // the js redis lib does not have the ZREVRANGEBYSCORE function so we use sendCommand to directly call it
  const result : string[] = await client.sendCommand(['ZREVRANGEBYSCORE', 'rankings', '+inf', '-inf', 'WITHSCORES']);

  // using the reduce array function to create a formatted object as result 
    // currently result looks like this (a list of strings): 
      // ['name', 'score'] for all ambassadors. We want it to be { name: score }
  let name;
  // we use reduce to loop through the 'result' list and create an object with the name as key and score as value
    // o is the prev val and r is the current val in loop
  res.status(200).send(result.reduce((o, r) => {
    // if the string is a name
    if (isNaN(parseInt(r))) {
      name = r;
      return o;
    }
    // if the string is a number 
    else {
      return {
        // spread operator to get all acummulated values of o so far
        ...o, 
        // and add the name as key and revenue as val to the end of o and return it as an object
        [name]: parseInt(r)
      };
    }
  }, 
    // for arr.reduce we need to give an initial value upon which we will accumuate, since in this case
    // we will be returning an object we initialize an empty one.
    {} 
  ));
}