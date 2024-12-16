import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GithubStrategy, Profile } from "passport-github2";
import UserModel from "../models/user"
import bcrypt from "bcrypt"
import env from "../env"
import { VerifyCallback } from "passport-oauth2"
//import mongoose from "mongoose";

// passport.serializeUser((user, cb) => {
//     cb(null, user);
// });

// passport.deserializeUser((user: Express.User, cb) => {
//     cb(null, user);
// })

// passport.serializeUser((user, cb) => {
//     cb(null, user._id);
// });

// passport.deserializeUser(async (userId: string, cb) => {
//     const user = await UserModel.findById(userId).select("+email").exec()
//     cb(null, user);
// });

passport.use(new LocalStrategy(async (username, password, cb) => {
    try {
        const existingUser = await UserModel.findOne({ username })
            .select("+email +password")
            .exec();

        if (!existingUser || !existingUser.password) {
            return cb(null, false);
        }

        const passwordMatch = await bcrypt.compare(password, existingUser.password);

        if (!passwordMatch) {
            return cb(null, false);
        }

        const user = existingUser.toObject();

        delete user.password;

        return cb(null, user);
    } catch (error) {
        cb(error);
    }
}));

passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.SERVER_URL + "/users/oauth2/redirect/google",
    scope: ["profile"]
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        let user = await UserModel.findOne({ googleId: profile.id }).exec()
        if (!user) {
            user = await UserModel.create({ googleId: profile.id })
        }
        cb(null, user)

    } catch (error) {
        cb(error)
    }
}))

passport.use(new GithubStrategy({
    clientID: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    callbackURL: env.SERVER_URL + "/users/oauth2/redirect/github",
},
    async (accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback) => {
        try {
            let user = await UserModel.findOne({ githubId: profile.id }).exec()
            if (!user) {
                user = await UserModel.create({ githubId: profile.id })
            }
            cb(null, user)
        } catch (error) {
            cb(error)
        }
    }))


passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET,
},
    async (user: Express.User, cb) => {
        try {
            const dbUser = await UserModel.findById(user._id).select("+email")
          //  console.log("payload " + JSON.stringify(dbUser));
            cb(null, dbUser)
        } catch (error) {
            cb(error)
        }
    }))



