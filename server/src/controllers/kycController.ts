import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { createBlock } from '../utils/blockchain.js';

export const verifyKYC = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, idType, idNumber } = req.body;

    if (!userId || !idType || !idNumber) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    if (idType !== 'Aadhaar' && idType !== 'Passport') {
      res.status(400).json({ success: false, message: 'Invalid ID type' });
      return;
    }

    // Validation Logic
    let isValid = false;
    let idNumberMasked = '';

    if (idType === 'Aadhaar') {
      // 12 digits exactly
      const aadhaarRegex = /^\d{12}$/;
      if (aadhaarRegex.test(idNumber)) {
        isValid = true;
        idNumberMasked = `XXXX-XXXX-${idNumber.slice(-4)}`;
      }
    } else if (idType === 'Passport') {
      // 7 alphanumeric characters
      const passportRegex = /^[A-Za-z0-9]{7}$/;
      if (passportRegex.test(idNumber)) {
        isValid = true;
        idNumberMasked = `XXX${idNumber.slice(-4)}`;
      }
    }

    if (!isValid) {
      res.status(400).json({ success: false, message: `Invalid ${idType} format` });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Document upload is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const kycDocumentUrl = `/uploads/${req.file.filename}`;

    user.idType = idType;
    user.idNumberMasked = idNumberMasked;
    user.kycDocumentUrl = kycDocumentUrl;
    user.isKycVerified = true;

    // Update Blockchain with KYC Event
    const block = await createBlock({
      userId: user._id.toString(),
      event: 'KYC_VERIFICATION',
      idType,
      idNumberMasked,
      kycDocumentUrl,
      verifiedAt: new Date().toISOString()
    });

    user.blockchainId = block.hash; // update hash to point to new block showing KYC status
    await user.save();

    res.json({
      success: true,
      message: 'KYC Verification successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isKycVerified: user.isKycVerified,
        idType: user.idType,
        idNumberMasked: user.idNumberMasked,
        kycDocumentUrl: user.kycDocumentUrl,
        blockchainId: user.blockchainId,
      },
    });
  } catch (error) {
    next(error);
  }
};
