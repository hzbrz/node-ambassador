import { Router } from 'express';
import { Register, Login } from './controller/controller';

export const routes = (router: Router) => {
  router.post('/api/admin/register', Register);
  router.post('/api/admin/login', Login);
}