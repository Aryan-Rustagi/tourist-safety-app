import CryptoJS from 'crypto-js';
import { Block, IBlock } from '../models/Block';

/**
 * Calculates SHA256 cryptographic hash for a block
 */
export const calculateHash = (
  index: number,
  timestamp: string,
  data: Record<string, any>,
  previousHash: string
): string => {
  const payload = `${index}${previousHash}${timestamp}${JSON.stringify(data)}`;
  const hash = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
  return `0x${hash}`;
};

/**
 * Creates and appends a new block to the simulated blockchain in MongoDB
 */
export const createBlock = async (data: Record<string, any>): Promise<IBlock> => {
  // 1. Fetch the last block in chain
  const lastBlock = await Block.findOne().sort({ index: -1 }).exec();

  const index = lastBlock ? lastBlock.index + 1 : 0;
  const previousHash = lastBlock ? lastBlock.hash : '0';
  const timestamp = new Date().toISOString();

  // 2. Calculate cryptographic hash
  const hash = calculateHash(index, timestamp, data, previousHash);

  // 3. Persist new block
  const newBlock = new Block({
    index,
    timestamp,
    data,
    previousHash,
    hash,
  });

  await newBlock.save();
  return newBlock;
};

/**
 * Verifies the integrity of a specific block
 */
export const verifyBlockHash = (block: IBlock): boolean => {
  const recalculated = calculateHash(block.index, block.timestamp, block.data, block.previousHash);
  return recalculated.toLowerCase() === block.hash.toLowerCase();
};

/**
 * Verifies the entire chain integrity
 */
export const verifyChainIntegrity = async (): Promise<{ valid: boolean; length: number; issue?: string }> => {
  const blocks = await Block.find().sort({ index: 1 }).exec();
  if (blocks.length === 0) {
    return { valid: true, length: 0 };
  }

  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i];

    // Check hash recalculation
    if (!verifyBlockHash(currentBlock)) {
      return { valid: false, length: blocks.length, issue: `Block #${currentBlock.index} hash mismatch` };
    }

    // Check previous hash linkage
    if (i > 0) {
      const prevBlock = blocks[i - 1];
      if (currentBlock.previousHash !== prevBlock.hash) {
        return {
          valid: false,
          length: blocks.length,
          issue: `Block #${currentBlock.index} previousHash does not match Block #${prevBlock.index} hash`,
        };
      }
    } else {
      if (currentBlock.previousHash !== '0') {
        return { valid: false, length: blocks.length, issue: 'Genesis block previousHash must be "0"' };
      }
    }
  }

  return { valid: true, length: blocks.length };
};
