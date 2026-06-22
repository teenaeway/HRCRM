import express from 'express';
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  uploadCandidateResume,
  toggleCandidateSelection
} from '../controllers/candidate.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes require admin or employee role
router.use(protect);
router.use(authorizeRoles('admin', 'employee'));

const cpUpload = upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'photo', maxCount: 1 }]);

router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/', cpUpload, createCandidate);
router.put('/:id', cpUpload, updateCandidate);
router.delete('/:id', deleteCandidate);
router.post('/:id/resume', upload.single('resume'), uploadCandidateResume);
router.patch('/:id/select', toggleCandidateSelection);

export default router;
