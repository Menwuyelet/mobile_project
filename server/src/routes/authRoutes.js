const express = require('express');
const {
  register,
  login,
  me,
  updateProfile,
  updatePassword,
  listUsersAdmin,
  setUserSuspension,
} = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, updatePassword);
router.get('/admin/users', requireAuth, requireAdmin, listUsersAdmin);
router.patch('/admin/users/:id/suspension', requireAuth, requireAdmin, setUserSuspension);

module.exports = router;
