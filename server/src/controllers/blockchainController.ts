import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { createBlock, verifyBlockHash, verifyChainIntegrity } from '../utils/blockchain.js';

/**
 * GET /api/blockchain/verify/:userId
 * Verifies the user's blockchain digital identity against the simulated ledger
 */
export const verifyUserIdentity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found in registry' });
      return;
    }

    // Auto-generate blockchain digital ID if missing
    if (!user.blockchainId) {
      const block = await createBlock({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        type: 'DIGITAL_IDENTITY_MINT',
      });
      user.blockchainId = block.hash;
      await user.save();
    }

    // Fetch the block corresponding to user's blockchain ID
    const block = await Block.findOne({ hash: user.blockchainId });

    const isValid = block ? verifyBlockHash(block) : false;

    res.json({
      success: true,
      verified: isValid,
      blockchainId: user.blockchainId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      block: block
        ? {
            index: block.index,
            timestamp: block.timestamp,
            previousHash: block.previousHash,
            hash: block.hash,
            data: block.data,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blockchain/blocks
 * Returns full simulated blockchain ledger for transparency/explorer view
 */
export const getLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    const chainStatus = await verifyChainIntegrity();

    res.json({
      success: true,
      chainLength: blocks.length,
      chainValid: chainStatus.valid,
      blocks,
    });
  } catch (error) {
    next(error);
  }
};
