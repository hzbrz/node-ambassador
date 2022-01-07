import { Router } from 'express';
import { Register, Login, AuthenticatedUser, Logout, UpdateInfo, UpdatePassword } from './controller/auth.controller.';
import { Links } from './controller/link.controller';
import { CreateProduct, DeleteProduct, GetProduct, Products, UpdateProduct } from './controller/product.controller';
import { Ambassadors } from './controller/user.controller';
import { AuthMiddleware } from './middleware/auth.middleware';

export const routes = (router: Router) => {
  /** Authentication routes */
  router.post('/api/admin/register', Register);
  router.post('/api/admin/login', Login);
  // AuthMiddleware checks if the user is authenticated
  router.get('/api/admin/user', AuthMiddleware, AuthenticatedUser);
  router.post('/api/admin/logout', AuthMiddleware, Logout);
  router.put('/api/admin/users/info', AuthMiddleware, UpdateInfo);
  router.put('/api/admin/users/password', AuthMiddleware, UpdatePassword);

  /** Ambassador routes */
  router.get('/api/admin/ambassadors', AuthMiddleware, Ambassadors);

  /** Product routes */
  // same route can be used for different http method and params
  router.get('/api/admin/products', AuthMiddleware, Products);
  router.post('/api/admin/products', AuthMiddleware, CreateProduct);
  router.post('/api/admin/products', AuthMiddleware, CreateProduct);
  router.get('/api/admin/products/:id', AuthMiddleware, GetProduct);
  router.put('/api/admin/products/:id', AuthMiddleware, UpdateProduct);
  router.delete('/api/admin/products/:id', AuthMiddleware, DeleteProduct);

  /** Links routes */
  router.get('/api/admin/users/:id/links', AuthMiddleware, Links);
}