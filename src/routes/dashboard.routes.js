const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Solo admin puede ver dashboard

router.get('/cartera', verifyToken, verifyAdmin, dashboardController.getCartera);

router.get('/utilidad-total', verifyToken, verifyAdmin, dashboardController.getUtilidadTotal);

router.get('/utilidad-diaria', verifyToken, verifyAdmin, dashboardController.getUtilidadDiaria);

router.get('/desempeno-cobrador', verifyToken, verifyAdmin, dashboardController.getDesempenoCobrador);

module.exports = router;
