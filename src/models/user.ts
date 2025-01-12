import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

interface IUser extends mongoose.Document {
  username: string
  password: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

// User schema definition
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    minLength: 3,
    maxLength: 30
  },
  password: { 
    type: String, 
    required: true,
    minLength: 8
  }
})

// Add password validation
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  // Check password strength
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(this.password)) {
    throw new Error('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character')
  }
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err as Error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model<IUser>('User', userSchema)
export default User
