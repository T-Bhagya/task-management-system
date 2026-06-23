const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All project routes require a valid JWT token
router.use(verifyToken);

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', requireAdmin, projectController.createProject);
router.put('/:id', requireAdmin, projectController.updateProject);
router.delete('/:id', requireAdmin, projectController.deleteProject);

router.post('/:id/members', projectController.addMembers);
router.delete('/:id/members/:userId', projectController.removeMember);

module.exports = router;
