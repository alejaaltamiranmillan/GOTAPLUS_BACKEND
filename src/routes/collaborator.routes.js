const express = require('express');
const router = express.Router();
const collaboratorController = require('../controllers/collaborator.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.post(
  '/',
  verifyToken,
  verifyAdmin,
  collaboratorController.createCollaborator
);

module.exports = router;
