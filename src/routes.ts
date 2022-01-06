import { Router } from 'express';
import { Register, Login, AuthenticatedUser, Logout } from './controller/controller';
import { AuthMiddleware } from './middleware/auth.middleware';

export const routes = (router: Router) => {
  router.post('/api/admin/register', Register);
  router.post('/api/admin/login', Login);
  // AuthMiddleware checks if the user is authenticated
  router.get('/api/admin/user', AuthMiddleware, AuthenticatedUser);
  router.post('/api/admin/logout', AuthMiddleware, Logout);
}