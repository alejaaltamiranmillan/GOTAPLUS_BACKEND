const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/login', userController.login);
router.post('/register/cobrador', userController.registerCobrador);

module.exports = router;