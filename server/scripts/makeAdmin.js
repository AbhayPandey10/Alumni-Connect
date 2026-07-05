// Promote a user to Admin by email.
// Usage:  node scripts/makeAdmin.js you@nitjsr.ac.in
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

await connectDB();
const user = await User.findOneAndUpdate({ email }, { role: 'Admin' }, { new: true });
console.log(user ? `✓ Promoted ${user.email} to Admin` : `✗ No user found with email ${email}`);
process.exit(0);
