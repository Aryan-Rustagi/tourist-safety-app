import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SOSAlert } from '../models/SOSAlert.js';
import { User } from '../models/User.js';
import { getSOSSocketIO } from './sosController.js';

export const handleSMSWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, body } = req.body;

    if (!body || typeof body !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid payload: body is required' });
      return;
    }

    // Expected format: ID:123|LAT:26.1445|LNG:91.7362|SOS
    // Parse the body string using split method
    const parts = body.split('|');
    const data: Record<string, string> = {};

    parts.forEach((part) => {
      const [key, value] = part.split(':');
      if (key && value) {
        data[key.trim()] = value.trim();
      } else if (key && !value) {
        // Handle flags like SOS
        data[key.trim()] = 'true';
      }
    });

    const userId = data['ID'];
    const latStr = data['LAT'];
    const lngStr = data['LNG'];
    const hasSOS = 'SOS' in data || body.includes('SOS');

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    // Fallback: match by sender phone number if available
    if (!user && from) {
      const cleanPhone = from.replace(/\D/g, '').slice(-10);
      user = await User.findOne({ phone: new RegExp(cleanPhone) });
    }

    // Fallback: match demo tourist or first tourist user
    if (!user) {
      user = await User.findOne({ role: 'TOURIST' }) || await User.findOne({});
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'No registered user profile found for distress signal' });
      return;
    }

    const isUnknownLoc =
      !latStr ||
      !lngStr ||
      latStr.toUpperCase() === 'UNKNOWN' ||
      lngStr.toUpperCase() === 'UNKNOWN' ||
      data['LOC'] === 'UNAVAILABLE';

    let latitude = isUnknownLoc ? 0 : parseFloat(latStr);
    let longitude = isUnknownLoc ? 0 : parseFloat(lngStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      latitude = 0;
      longitude = 0;
    }

    const hasPreciseLocation = !isUnknownLoc && (latitude !== 0 || longitude !== 0);

    // Update user coordinates in MongoDB only if valid non-zero location was acquired
    if (hasPreciseLocation) {
      user.latitude = latitude;
      user.longitude = longitude;
      await user.save();
    }

    const distressMessage = hasPreciseLocation
      ? `EMERGENCY SOS via SMS: Tourist in distress! Sender: ${from || 'GSM Network'}`
      : `EMERGENCY SOS via SMS: Tourist in distress! (GPS Signal Unavailable - GSM Tower Triangulation Required) Sender: ${from || 'GSM Network'}`;

    // If SOS is present, create or update active SOSAlert document with status ACTIVE
    if (hasSOS) {
      const existingAlert = await SOSAlert.findOne({
        userId: user._id,
        status: { $in: ['ACTIVE', 'PENDING', 'ACKNOWLEDGED'] },
      });

      let alert;
      if (existingAlert) {
        existingAlert.latitude = hasPreciseLocation ? latitude : (user.latitude || 0);
        existingAlert.longitude = hasPreciseLocation ? longitude : (user.longitude || 0);
        existingAlert.message = distressMessage;
        existingAlert.status = 'ACTIVE';
        alert = await existingAlert.save();
      } else {
        alert = await SOSAlert.create({
          userId: user._id,
          latitude: hasPreciseLocation ? latitude : (user.latitude || 0),
          longitude: hasPreciseLocation ? longitude : (user.longitude || 0),
          message: distressMessage,
          status: 'ACTIVE',
        });
      }

      const populatedAlert = await SOSAlert.findById(alert._id).populate(
        'userId',
        'name email phone role'
      );

      // Uses getSOSSocketIO() to emit an event named new_sos_alert to all connected clients
      const io = getSOSSocketIO();
      if (io && populatedAlert) {
        io.emit('new_sos_alert', populatedAlert);
        console.log(`[Socket.IO] Broadcasted Offline SMS SOS Alert: ${alert._id}`);
      }
    }

    // Returns a 200 response with success message
    res.status(200).json({
      success: true,
      message: 'SMS Webhook processed successfully. Alert is live on Police Radar.',
    });
  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    next(error);
  }
};
