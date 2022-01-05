import express from 'express';
import cors from 'cors';
import { createConnection } from 'typeorm';
import { routes } from './routes';
import { config } from 'dotenv';

config();


/* 
  info to create the connection is gotten from ormconfig.json 
  in that file we set the "host" to the service name of the docker image and the "port" to the port 
  we are connecting mysql on inside the docker image which is 3306 (as seen on docker-compose.yaml). 
*/ 
createConnection().then(() => {
  const app = express();

  // this is a middleware that makes sure that when we send a request to a route it is coverted to json
  app.use(express.json());
  // middleware to enable cors
  app.use(cors({
    origin: [
      'http://localhost:3000'
    ]
  }));

  routes(app);
  
  app.listen(8000, () => {
    console.log("Listening to port 8000")
  })
})

