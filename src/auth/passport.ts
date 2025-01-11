import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/user";

declare global {
  namespace Express {
    interface User {
      id?: number;
    }
  }
}

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username })
    if (!user) {
      return done(null, false, { message: "Incorrect username" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return done(null, false, { message: "Incorrect password" })
    }

    return done(null, user)
  }
  catch (err) {
    return done(err)
  }
}))

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id)
})

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})
