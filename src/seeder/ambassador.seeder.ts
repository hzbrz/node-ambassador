import { hash } from "bcryptjs";
import { createConnection, getRepository } from "typeorm";
import { User } from "../entity/user.entity";
import faker from 'faker';

/** 
 * seeders need to be run from inside the docker container, since it is not part of the app it does not have
 * connection to the running docker container and therefore cannot connect to the databse
 * go inside docker container with the node app using docker-compose exec backend sh
 * and run the command from there
*/

// need to createConnection again just like the index file, we need to create this because 
// the seeder will be a seperate command (apart from the app) we will run to generate data
createConnection().then(async () => {
  const repository = getRepository(User);

  const password = await hash("1234", 10);

  // make 30 ambassadors
  for (let i = 0; i <30; i++) {
    await repository.save({
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      email: faker.internet.email(),
      password,
      is_ambassador: true
    })  
  }

  // exit the command once it is executed
  process.exit();
});