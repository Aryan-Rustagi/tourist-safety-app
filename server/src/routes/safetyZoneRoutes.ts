import { Router } from 'express';
import {
  getSafetyZones,
  createSafetyZone,
  updateSafetyZone,
  deleteSafetyZone,
  checkLocationRisk,
  ingestOsmSafetyZones,
} from '../controllers/safetyZoneController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public: list all safety zones
router.get('/', getSafetyZones);

// Public/Tourist: check real-time risk level of current GPS coords
router.get('/check-risk', checkLocationRisk);

// Admin: ingest real-world facilities from OpenStreetMap
router.post('/ingest-osm', protect, authorize('ADMIN'), ingestOsmSafetyZones);

// Admin: create zone
router.post('/', protect, authorize('ADMIN'), createSafetyZone);

// Admin: update zone
router.put('/:id', protect, authorize('ADMIN'), updateSafetyZone);

// Admin: delete zone
router.delete('/:id', protect, authorize('ADMIN'), deleteSafetyZone);

export default router;
