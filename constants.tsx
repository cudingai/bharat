
import React from 'react';

export const COLORS = {
  softTeal: '#4FA3A5',
  lightSand: '#FDFBF7',
  mutedGreen: '#7FB069',
  warmAmber: '#E6A34A',
  charcoal: '#333333',
  softGrey: '#E5E7EB',
};

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Food: <i className="fas fa-utensils"></i>,
  Travel: <i className="fas fa-car"></i>,
  Subscriptions: <i className="fas fa-redo"></i>,
  Impulse: <i className="fas fa-bolt"></i>,
  Misc: <i className="fas fa-ellipsis-h"></i>,
  Utilities: <i className="fas fa-plug"></i>,
};

export const MOCK_SMS_TEMPLATES = [
  "Paid ₹20.00 for Chai at Raju Tea Stall. Ref: UPI 432109.",
  "Your a/c X1234 debited by ₹35.00 to Auto Rickshaw. Bal: ₹4500.",
  "Success: ₹199 paid for Monthly Netflix Sub.",
  "UPI: ₹45 sent to Om Sweets for Samosa.",
  "Wallet Debit: ₹12 for public parking."
];
