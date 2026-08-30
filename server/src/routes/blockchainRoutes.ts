import { Router } from 'express';
import { verifyUserIdentity, getLedger } from '../controllers/blockchainController.js';

const router = Router();

// Verify user digital ID on chain
router.get('/verify/:userId', verifyUserIdentity);

// Get full blockchain ledger
router.get('/blocks', getLedger);

export default router;
