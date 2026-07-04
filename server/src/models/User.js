import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@nitjsr\.ac\.in$/, 'Please use a valid NIT Jamshedpur email address (@nitjsr.ac.in)'] 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['Student', 'Alumni', 'Admin'], 
    required: true 
  },
  graduationYear: { 
    type: Number, 
    required: true 
  },
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);