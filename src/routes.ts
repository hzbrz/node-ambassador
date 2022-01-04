import { Router } from 'express';
import { Register, ShowOrders } from './controller/controller';

export const routes = (router: Router) => {
  router.post('/api/admin/register', Register);
  router.get('/api/admin/show', ShowOrders);
}