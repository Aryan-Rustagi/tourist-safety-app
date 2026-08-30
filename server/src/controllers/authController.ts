import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser, UserRole } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { EmergencyContact } from '../models/EmergencyContact.js';

import { createBlock } from '../utils/blockchain.js';

// Helper to generate JWT
const generateToken = (id: string, role: UserRole): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_tourist_safety_2026';
  return jwt.sign({ id, role }, secret, {
    expiresIn: '30d',
  });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'TOURIST',
    });

    // Mint Blockchain Digital ID for the tourist prototype
    try {
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
    } catch (blockErr) {
      console.warn('Failed to mint initial blockchain block:', blockErr);
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        blockchainId: user.blockchainId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Explicitly include password for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Auto-mint blockchainId if existing user doesn't have one
    if (!user.blockchainId) {
      try {
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
      } catch (e) {
        console.warn('Could not auto-mint block on login:', e);
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        blockchainId: user.blockchainId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (!req.user.blockchainId) {
      try {
        const block = await createBlock({
          userId: req.user._id.toString(),
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
          role: req.user.role,
          type: 'DIGITAL_IDENTITY_MINT',
        });
        req.user.blockchainId = block.hash;
        await req.user.save();
      } catch (e) {
        console.warn('Could not auto-mint block on getMe:', e);
      }
    }

    const contacts = await EmergencyContact.find({ userId: req.user._id });

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        blockchainId: req.user.blockchainId,
        createdAt: req.user.createdAt,
      },
      contacts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        role: user?.role,
        blockchainId: user?.blockchainId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential token is required' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, message: 'Invalid Google token payload' });
      return;
    }

    const { email, name, sub: googleId, picture: avatar } = payload;

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // If user exists without googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      if (!user.blockchainId) {
        try {
          const block = await createBlock({
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            type: 'DIGITAL_IDENTITY_MINT',
          });
          user.blockchainId = block.hash;
        } catch (e) {
          console.warn('Could not mint block for existing Google user:', e);
        }
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        googleId,
        avatar,
        role: role || 'TOURIST',
      });

      try {
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
      } catch (e) {
        console.warn('Could not mint block for new Google user:', e);
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        blockchainId: user.blockchainId,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

export const getTourists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tourists = await User.find({ role: 'TOURIST' })
      .select('-password -__v')
      .sort('-createdAt');
      
    res.json({
      success: true,
      count: tourists.length,
      tourists,
    });
  } catch (error) {
    next(error);
  }
};
