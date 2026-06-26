const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, requireAdmin, requireAdminOrPM } = require('../middleware/authMiddleware');

// All project routes require a valid JWT token
router.use(verifyToken);

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', requireAdminOrPM, projectController.createProject);
router.put('/:id', requireAdminOrPM, projectController.updateProject);
router.delete('/:id', requireAdminOrPM, projectController.deleteProject);

router.post('/:id/members', projectController.addMembers);
router.delete('/:id/members/:userId', projectController.removeMember);

module.exports = router;
