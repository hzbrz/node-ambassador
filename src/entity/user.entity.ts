import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// this will be our schema for the user entity and will be translated to the User db table
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;
  
  // email is set to unique so we it will be a field with unique constraint
  @Column({ unique:true })
  email: string;
  
  @Column()
  password: string;
  
  @Column()
  is_ambassador: boolean;
}