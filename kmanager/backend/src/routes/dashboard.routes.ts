import { Router } from 'express';
import { dashboardController } from '@controllers/dashboard.controller';
import { authMiddleware } from '@middlewares/auth.middleware';

const router = Router();

// Todas las rutas de dashboard requieren autenticación JWT
router.use(authMiddleware);

router.get('/summary', (req, res) => dashboardController.getSummary(req as any, res));
router.get('/transactions', (req, res) => dashboardController.getTransactions(req as any, res));
router.post('/transactions', (req, res) => dashboardController.createTransaction(req as any, res));
router.delete('/transactions/:id', (req, res) => dashboardController.deleteTransaction(req as any, res));
router.get('/categories', (req, res) => dashboardController.getCategories(req as any, res));
router.get('/quick-expenses', (req, res) => dashboardController.getQuickExpenses(req as any, res));
router.post('/quick-expenses', (req, res) => dashboardController.createQuickExpense(req as any, res));

export default router;

