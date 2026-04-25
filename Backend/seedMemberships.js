/**
 * seedMemberships.js
 * Run this script once to seed the 3 default membership plans:
 *   node seedMemberships.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const MembershipPlan = require('./Model/MembershipPlan');

const plans = [
  {
    name: 'Basic',
    price: 999,
    duration: 30,
    benefits: [
      'Access to standard facilities',
      'Booking priority during off-peak hours',
      '5% discount on all bookings',
      'Monthly newsletter',
    ],
    discountPercentage: 5,
    isActive: true,
  },
  {
    name: 'Gold',
    price: 2499,
    duration: 90,
    benefits: [
      'Access to all facilities including premium courts',
      'Booking priority at all times',
      '15% discount on all bookings',
      'Free locker room access',
      'Monthly fitness assessment',
      'Guest pass (1 per month)',
    ],
    discountPercentage: 15,
    isActive: true,
  },
  {
    name: 'Platinum',
    price: 4999,
    duration: 365,
    benefits: [
      'Unlimited access to ALL facilities',
      'Priority booking + guaranteed slots',
      '25% discount on all bookings',
      'Free personal trainer sessions (2/month)',
      'Unlimited guest passes',
      'Dedicated locker',
      'Spa & recovery room access',
      'Exclusive member events',
    ],
    discountPercentage: 25,
    isActive: true,
  },
];

mongoose
  .connect(
    process.env.MONGODB_URI ||
      'mongodb+srv://hansaninavodya825_db_user:hAgmdDYQ2U9FPfzA@hansani.xoabwdi.mongodb.net/sports_complex?retryWrites=true&w=majority'
  )
  .then(async () => {
    console.log('MongoDB connected — seeding membership plans...');
    for (const plan of plans) {
      await MembershipPlan.findOneAndUpdate({ name: plan.name }, plan, {
        upsert: true,
        new: true,
      });
      console.log(`✅ Upserted plan: ${plan.name}`);
    }
    console.log('✅ All membership plans seeded successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
