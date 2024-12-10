import { RequestHandler } from "express";
import UserModel from "../models/user";
import EmailVerificationModel from "../models/emailVerification";
import createHttpError from "http-errors";
import bcrypt from "bcrypt"
import assertIsDefined from "../utils/assertIsDefined";
import { EmailVerificationBody, ResetPasswordBody, SignupBody, UpdateUserBody } from "../validation/user";
import sharp from "sharp";
import env from "../env";
import crypto from "crypto";
import PasswordResetModel from "../models/resetPasswordVerification";
import * as Email from "../utils/email";
import { destroyAllActiveSessionsForUser } from "../utils/auth";


export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
    const authenticatedUser = req.user

    try {
        assertIsDefined(authenticatedUser)

        res.status(200).json(authenticatedUser)
    } catch (error) {
        next(error)
    }

}


export const signup: RequestHandler<unknown, unknown, SignupBody, unknown> = async (req, res, next) => {
    try {
        const { username, email, password: rawPassword, verificationCode } = req.body
        const existingUsername = await UserModel.findOne({ username })
            .collation({ locale: "en", strength: 2 })// to compare without casing ("Ali","ali")
            .exec()
        const existingEmail = await UserModel.findOne({ email }).exec()
        if (existingUsername) {
            throw createHttpError(409, "username already exists")
        }
        if (existingEmail) {
            throw createHttpError(409, "email already exists")
        }
        if (rawPassword.length < 3) {
            throw createHttpError(409, "too short password")
        }

        const emailVerificationToken = await EmailVerificationModel.findOne({ email, verificationCode }).exec();

        if (!emailVerificationToken) {
            throw createHttpError(400, "Verification code incorrect or expired.");
        } else {
            await emailVerificationToken.deleteOne();
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10)

        const result = await UserModel.create({
            username,
            displayName: username,
            email,
            password: hashedPassword
        })
        const newUser = result.toObject()
        delete newUser.password

        req.logIn(newUser, error => {
            if (error) throw error

            res.status(201).json(newUser)
        })

    } catch (error) {
        next(error)
    }
}

export const requestEmailVerificationCode: RequestHandler<unknown, unknown, EmailVerificationBody, unknown> = async (req, res, next) => {
    try {
        const { email } = req.body
        const existingEmail = await UserModel.findOne({ email })
            .collation({ locale: "en", strength: 2 })
            .exec();
        if (existingEmail) {
            throw createHttpError(409, "A user with this email address already exists. Please log in instead.");
        }
        const verificationCode = crypto.randomInt(100000, 999999).toString();

        await EmailVerificationModel.create({ email, verificationCode })
        await Email.sendVerificationCode(email, verificationCode);

        res.sendStatus(200);
    } catch (error) {
        next(error)
    }
}

export const requestResetPasswordCode: RequestHandler<unknown, unknown, EmailVerificationBody, unknown> = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await UserModel.findOne({ email })
            .collation({ locale: "en", strength: 2 })
            .exec();

        if (!user) {
            throw createHttpError(404, "A user with this email doesn't exist. Please sign up instead.");
        }

        const verificationCode = crypto.randomInt(100000, 999999).toString();
        await PasswordResetModel.create({ email, verificationCode });

        await Email.sendPasswordResetCode(email, verificationCode)

        res.send(200).json("verification code has been sent")


    } catch (error) {
        next(error)
    }
}

export const resetPassword: RequestHandler<unknown, unknown, ResetPasswordBody, unknown> = async (req, res, next) => {
    try {
        const { email, password: newPasswordRaw, verificationCode } = req.body

        const user = await UserModel.findOne({ email }).select("+email")
            .collation({ locale: "en", strength: 2 })
            .exec();

        if (!user) {
            throw createHttpError(404, "user not found")
        }
        const passwordRest = await PasswordResetModel.findOne({ email, verificationCode }).exec()

        if (!passwordRest) {
            throw createHttpError(400, "Verification code incorrect or expired.");
        } else {
            await passwordRest.deleteOne();
        }

        await destroyAllActiveSessionsForUser(user._id.toString())

        const newPasswordHashed = await bcrypt.hash(newPasswordRaw, 10)
        user.password = newPasswordHashed
        await user.save()

        delete user.toObject().password

        req.logIn(user, error => {
            if (error) throw error

            res.status(200).json(user)
        })

    } catch (error) {
        next(error)
    }
}

export const updateUser: RequestHandler<unknown, unknown, UpdateUserBody, unknown> = async (req, res, next) => {
    try {

        const { username, about, displayName } = req.body
        const userId = req.user?._id
        const profilePic = req.file
        assertIsDefined(userId)

        const existingUsername = await UserModel.findOne({ username }).exec()
        if (existingUsername) {
            throw createHttpError(409, "username already exists")
        }
        let imagePath: string | undefined
        if (profilePic) {
            imagePath = "/uploads/profile-images/" + userId + ".png"

            await sharp(profilePic.buffer)
                .resize(500, 500, { withoutEnlargement: true })
                .toFile("." + imagePath)
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId,
            {
                $set: {
                    ...(username && { username }),
                    ...(displayName && { displayName }),
                    ...(about && { about }),
                    ...(profilePic && { profilePicUrl: env.SERVER_URL + imagePath })
                }
            }, { new: true }/* to return object after update*/).exec()

        res.status(200).json(updatedUser)

    } catch (error) {
        next(error)
    }
}

export const getUserByUsername: RequestHandler = async (req, res, next) => {
    try {
        const username = req.params.username
        const user = await UserModel.findOne({ username }).exec()
        if (!user) {
            throw createHttpError(404, "User not found");
        }
        res.status(200).json(user)

    } catch (error) {
        next(error)
    }
}


export const logout: RequestHandler = (req, res) => {
    req.logOut(error => {
        if (error) throw error
        res.sendStatus(200)
    })
}