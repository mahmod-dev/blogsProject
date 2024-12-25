import { RequestHandler } from "express";
import UserModel, { User } from "../database/models/user";
import EmailVerificationModel from "../database/models/emailVerification";
import createHttpError from "http-errors";
import bcrypt from "bcrypt"
import assertIsDefined from "../utils/assertIsDefined";
import { EmailVerificationBody, LoginBody, ResetPasswordBody, SignupBody, UpdateUserBody } from "../validation/user";
import sharp from "sharp";
import env from "../env";
import crypto from "crypto";
import * as Email from "../utils/email";
import { destroyAllActiveSessionsForUser } from "../utils/auth";
import jwt from "jsonwebtoken"
import { setActivelistToken, getTokenFromHeader } from "../config/jwt";
import redisClient from "../config/redisClient";

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
        const existingUsername = await UserModel.findOne({ where: { username } })
        const existingEmail = await UserModel.findOne({ where: { email } })
        if (existingUsername) {
            throw createHttpError(409, "username already exists")
        }
        if (existingEmail) {
            throw createHttpError(409, "email already exists")
        }
        if (rawPassword.length < 3) {
            throw createHttpError(409, "too short password")
        }

        const emailVerificationToken = await EmailVerificationModel.findOne({ where: { email, verificationCode, emailType: 1 } })

        if (!emailVerificationToken) {
            throw createHttpError(400, "Verification code incorrect or expired.");
        } else {
            await emailVerificationToken.destroy();
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10)

        const newUser = await UserModel.create({
            username,
            displayName: username,
            email,
            password: hashedPassword
        })

        const token = jwt.sign(newUser.toJSON(),
            env.JWT_SECRET,
            { expiresIn: "1d" })

        setActivelistToken(newUser._id, token)
        res.status(201).json({ user: newUser, token })

    } catch (error) {
        next(error)
    }
}

export const requestEmailVerificationCode: RequestHandler<unknown, unknown, EmailVerificationBody, unknown> = async (req, res, next) => {
    try {
        const { email } = req.body
        const existingEmail = await UserModel.findOne({ where: { email } })

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

        const user = await UserModel.findOne({ where: { email } })


        if (!user) {
            throw createHttpError(404, "A user with this email doesn't exist. Please sign up instead.");
        }

        const verificationCode = crypto.randomInt(100000, 999999).toString();
        await EmailVerificationModel.create({ email, verificationCode, emailType: 2 });

        await Email.sendPasswordResetCode(email, verificationCode)

        res.send(200).json("verification code has been sent")

    } catch (error) {
        next(error)
    }
}

export const resetPassword: RequestHandler<unknown, unknown, ResetPasswordBody, unknown> = async (req, res, next) => {
    try {
        const { email, password: newPasswordRaw, verificationCode } = req.body

        const existingUser = await UserModel.unscoped().findOne({ where: { email } })


        if (!existingUser) {
            throw createHttpError(404, "user not found")
        }
        const passwordRest = await EmailVerificationModel.findOne({
            where: { email, verificationCode, emailType: 2 }
        })


        if (!passwordRest) {
            throw createHttpError(400, "Verification code incorrect or expired.");
        } else {
            await passwordRest.destroy();
        }

        await destroyAllActiveSessionsForUser(existingUser._id.toString())

        const newPasswordHashed = await bcrypt.hash(newPasswordRaw, 10)
        existingUser.password = newPasswordHashed
        await existingUser.save()

        const user = existingUser.toJSON<User>()

        delete user.password;

        res.status(200).json(user)

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

        if (username) {
            const existingUsername = await UserModel.findOne({
                where: { username }
            })
            if (existingUsername) {
                throw createHttpError(409, "username already exists")
            }
        }

        let imagePath: string | undefined
        if (profilePic) {
            imagePath = "/uploads/profile-images/" + userId + ".png"

            await sharp(profilePic.buffer)
                .resize(500, 500, { withoutEnlargement: true })
                .toFile("." + imagePath)
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [rowCount, updatedUser] = await UserModel.update(
            {
                ...(username && { username }),
                ...(displayName && { displayName }),
                ...(about && { about }),
                ...(profilePic && { profilePicUrl: env.SERVER_URL + imagePath })
            },
            {
                where: { _id: userId },
                returning: true
            })

        res.status(200).json(updatedUser[0])

    } catch (error) {
        next(error)
    }
}

export const getUserByUsername: RequestHandler = async (req, res, next) => {
    try {
        const username = req.params.username
        const user = await UserModel.findOne({
            where: { username }
        })
        if (!user) {
            throw createHttpError(404, "User not found");
        }
        res.status(200).json(user)

    } catch (error) {
        next(error)
    }
}


export const logout: RequestHandler = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req)

        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, { MATCH: `[^-]*_${token}`, COUNT: 1000 });

            if (result.keys.length == 0) {
                throw createHttpError(401, "unathorized")
            } else {
                for (const key of result.keys) {
                    await redisClient.del(key);
                    res.sendStatus(200)
                }
            }
            cursor = result.cursor;
        } while (cursor !== 0);
    } catch (error) {
        next(error)
    }
}

export const login: RequestHandler<unknown, unknown, LoginBody, unknown> = async (req, res, next) => {

    try {
        const { username, password: rawPassword } = req.body
        const existingUser = await UserModel.unscoped().findOne({
            where: { username }
        })

        if (!existingUser || !existingUser.password) {
            throw createHttpError(404, "user not found")
        }

        const passwordMatch = await bcrypt.compare(rawPassword, existingUser.password);

        if (!passwordMatch) {
            throw createHttpError(404, "password not matched")
        }
        const user = existingUser.toJSON<User>()

        delete user.password;

        const token = jwt.sign(user,
            env.JWT_SECRET,
            { expiresIn: "1d" })

        setActivelistToken(user._id, token)
        res.status(200).json({ user, token })

    } catch (error) {
        next(error)
    }

}