"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("@controllers/dashboard.controller");
const auth_middleware_1 = require("@middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas de dashboard requieren autenticación JWT
router.use(auth_middleware_1.authMiddleware);
router.get('/summary', (req, res) => dashboard_controller_1.dashboardController.getSummary(req, res));
router.get('/transactions', (req, res) => dashboard_controller_1.dashboardController.getTransactions(req, res));
router.post('/transactions', (req, res) => dashboard_controller_1.dashboardController.createTransaction(req, res));
router.delete('/transactions/:id', (req, res) => dashboard_controller_1.dashboardController.deleteTransaction(req, res));
router.get('/categories', (req, res) => dashboard_controller_1.dashboardController.getCategories(req, res));
router.get('/quick-expenses', (req, res) => dashboard_controller_1.dashboardController.getQuickExpenses(req, res));
router.post('/quick-expenses', (req, res) => dashboard_controller_1.dashboardController.createQuickExpense(req, res));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map