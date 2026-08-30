import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { RedZone } from '../models/RedZone.js';
import { RiskZone } from '../models/RiskZone.js';
import IncidentReport from '../models/IncidentReport.js';
import { sendChatWithFallback } from '../utils/openrouter.js';

/* ─────────────────────────────────────────────
   OpenRouter client (lazy-loaded so dotenv is ready)
───────────────────────────────────────────── */
let orClient: OpenAI;
const getOpenRouterClient = () => {
  if (!orClient) {
    orClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'missing-key',
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }
  return orClient;
};

/* ═══════════════════════════════════════════════════
   Feature 1 – Risk Score (OpenRouter FREE models)
═══════════════════════════════════════════════════ */

/**
 * POST /api/ai/risk-score
 * Accepts { lat, lng, currentWeather, time } → AI risk assessment.
 */
export const getRiskScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lat, lng, currentWeather, time } = req.body;

    const prompt = `You are a tourist safety risk assessor. Evaluate the risk score for a tourist currently at Latitude: ${lat}, Longitude: ${lng}.
Current Time: ${time || new Date().toISOString()}
Current Weather/Conditions: ${currentWeather || 'Unknown'}

Based on general knowledge of safety, time of day, and typical risks in this region, provide a risk assessment.
CRITICAL: If the weather conditions indicate a hazard (e.g. heavy rain, extreme heat, storms), explicitly warn the user and adjust the risk score and suggested action accordingly.
Return ONLY a raw JSON object (no markdown, no backticks) with the following structure:
{
  "riskScore": (a number between 0 and 100),
  "riskLevel": (exactly one of: "GREEN", "YELLOW", "ORANGE", "RED"),
  "suggestedAction": (a short string suggesting what the tourist should do)
}`;

    const result = await sendChatWithFallback(
      [{ role: 'user', content: prompt }],
      'You are a JSON-only safety risk assessor. Return ONLY valid JSON, no markdown.'
    );

    const text = (result.content || '').trim();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const data = JSON.parse(cleaned);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error generating risk score:', error.message || error);
    // Return a safe fallback instead of crashing
    res.json({
      success: true,
      data: {
        riskScore: 25,
        riskLevel: 'GREEN',
        suggestedAction: 'Stay aware of your surroundings. Keep emergency number 112 handy.'
      }
    });
  }
};

/* ═══════════════════════════════════════════════════
   Feature 2 – Safety Chatbot (OpenRouter with Fallback)
   POST /api/ai/chat
═══════════════════════════════════════════════════ */
export const safetyChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, history, lat, lng } = req.body;

    if (!message && (!history || !Array.isArray(history))) {
      res.status(400).json({ success: false, message: 'message or history array is required.' });
      return;
    }

    const contextStr =
      'You are a safety assistant for tourists in rural India. ' +
      'Always be calm, clear, and action-oriented. ' +
      'Prioritize emergency safety and practical next steps. ' +
      'If the user is in immediate danger, instruct them to move to a public place, notify nearby authorities, and call 112 immediately. ' +
      'For non-emergency questions, give short, direct advice with 2-4 practical steps. ' +
      'Use the user\'s provided location only as context, never claim you can track them unless they share exact location. ' +
      'Never provide illegal or unsafe instructions. ' +
      `The user's current GPS location is: Latitude ${lat ?? 'Unknown'}, Longitude ${lng ?? 'Unknown'}.`;

    // Support both old format (message) and new format (history array)
    const chatHistory = history && Array.isArray(history)
      ? history
      : [{ role: 'user', content: message }];

    const assistantMessage = await sendChatWithFallback(chatHistory, contextStr);

    res.json({
      success: true,
      reply: assistantMessage.content,
    });
  } catch (error: any) {
    console.error('Error in safety chat:', error.message || error);
    res.json({
      success: true,
      reply: '⚠️ AI is temporarily offline. For emergencies, please call **112** (National Emergency) or **1363** (Tourist Helpline).'
    });
  }
};

export const checkGeofence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lat, lng } = req.body;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ success: false, message: 'lat and lng are required.' });
      return;
    }

    const zones = await RiskZone.find({});
    const earthRadiusKm = 6371;
    const toRadians = (value: number) => (value * Math.PI) / 180;
    let nearestZone: { distanceKm: number; riskLevel: string } | null = null;

    for (const zone of zones) {
      const dLat = toRadians(zone.lat - lat);
      const dLng = toRadians(zone.lng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat)) * Math.cos(toRadians(zone.lat)) * Math.sin(dLng / 2) ** 2;
      const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (distanceKm <= zone.radius_km && (!nearestZone || distanceKm < nearestZone.distanceKm)) {
        nearestZone = { distanceKm, riskLevel: zone.risk_level };
      }
    }

    res.json({
      success: true,
      is_in_zone: Boolean(nearestZone),
      zone_name: nearestZone ? 'Mapped Risk Zone' : null,
      risk_level: nearestZone?.riskLevel || null,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   Feature 3 – AI Risk Zone Generator (OpenRouter)
   POST /api/ai/generate-risk-zones
═══════════════════════════════════════════════════ */
export const generateRiskZones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Accept incidents from request body OR fall back to DB
    let incidents: { lat: number; lng: number; type: string; date: string }[] =
      req.body.incidents;

    if (!incidents || incidents.length === 0) {
      const dbIncidents = await IncidentReport.find()
        .sort({ createdAt: -1 })
        .limit(100);
      incidents = dbIncidents.map((inc) => ({
        lat: inc.latitude,
        lng: inc.longitude,
        type: inc.category,
        date: inc.createdAt.toISOString(),
      }));
    }

    if (incidents.length === 0) {
      res
        .status(400)
        .json({ success: false, message: 'No incident data available to generate zones.' });
      return;
    }

    const systemPrompt =
      'You are an AI spatial risk analyst specializing in tourist safety in India. ' +
      'Your task is to cluster geographical incident data and identify high-risk circular zones. ' +
      'Output ONLY valid JSON matching the schema — no commentary, no markdown. ' +
      'Schema: { "zones": [{ "lat": number, "lng": number, "radius_km": number, "risk_level": "LOW" | "MEDIUM" | "HIGH" }] }';

    const userPrompt =
      `Analyze the following ${incidents.length} historical safety incidents:\n` +
      JSON.stringify(incidents, null, 2) +
      '\n\nCluster these incidents geographically and return between 1 and 5 circular risk zones. ' +
      'Each zone should cover a cluster of incidents. ' +
      'Set risk_level based on incident density and severity: ' +
      'HIGH if 3+ serious incidents, MEDIUM if 2+, LOW otherwise. ' +
      'Return ONLY a raw JSON object (no markdown, no backticks).';

    const result = await sendChatWithFallback(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    const raw = (result.content || '{}').trim();
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const parsed: { zones: { lat: number; lng: number; radius_km: number; risk_level: string }[] } =
      JSON.parse(cleaned);

    // Persist to MongoDB
    const savedZones = await RiskZone.insertMany(
      parsed.zones.map((z) => ({
        lat: z.lat,
        lng: z.lng,
        radius_km: z.radius_km,
        risk_level: z.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
        generatedAt: new Date(),
      }))
    );

    res.json({
      success: true,
      message: `${savedZones.length} AI-generated risk zones saved.`,
      zones: savedZones,
    });
  } catch (error: any) {
    console.error('Error generating risk zones:', error.message || error);
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   Feature 4 – Generate Red Zones (OpenRouter)
   POST /api/ai/generate-red-zones
═══════════════════════════════════════════════════ */
export const generateRedZones = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recentIncidents = await IncidentReport.find()
      .sort({ createdAt: -1 })
      .limit(50);
    const incidentDataStr = recentIncidents
      .map(
        (inc) =>
          `Category: ${inc.category}, Title: ${inc.title}, Location: [${inc.longitude}, ${inc.latitude}]`
      )
      .join('\n');

    if (!incidentDataStr) {
      res.status(400).json({ success: false, message: 'No incidents to analyze.' });
      return;
    }

    const systemPrompt = 'You are an AI spatial analyst. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Analyze the following recent incident reports:
${incidentDataStr}

Based on these incidents, generate 1 or 2 high-risk "Red Zone" clusters. Each cluster should be represented as a GeoJSON Polygon.
Return ONLY a raw JSON object (no markdown, no backticks) with the following structure:
{
  "redZones": [
    {
      "name": "Generated Red Zone Cluster A",
      "description": "Area with high concentration of recent incidents.",
      "coordinates": [[[lng1, lat1], [lng2, lat2], [lng3, lat3], [lng4, lat4], [lng1, lat1]]]
    }
  ]
}
The first and last coordinate MUST be identical to close the polygon.`;

    const result = await sendChatWithFallback(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    const text = (result.content || '').trim();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const data = JSON.parse(cleaned);

    const createdZones = [];
    if (data.redZones && Array.isArray(data.redZones)) {
      for (const zone of data.redZones) {
        const newZone = await RedZone.create({
          name: zone.name || 'AI Generated Red Zone',
          description: zone.description || 'Automatically identified high risk cluster.',
          coordinates: zone.coordinates,
          isActive: true,
        });
        createdZones.push(newZone);
      }
    }

    res.json({
      success: true,
      message: 'Red zones successfully generated by AI',
      count: createdZones.length,
      zones: createdZones,
    });
  } catch (error: any) {
    console.error('Error generating red zones:', error.message || error);
    next(error);
  }
};
