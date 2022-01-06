import { Router } from 'express';
import { Register, Login, AuthenticatedUser, Logout } from './controller/controller';

export const routes = (router: Router) => {
  router.post('/api/admin/register', Register);
  router.post('/api/admin/login', Login);
  router.get('/api/admin/user', AuthenticatedUser);
  router.post('/api/admin/logout', Logout);
}