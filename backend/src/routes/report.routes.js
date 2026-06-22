import express from 'express';
import { getEmployeeReport } from '../controllers/report.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/employee/:employeeId', protect, authorizeRoles('admin'), getEmployeeReport);

export default router;
