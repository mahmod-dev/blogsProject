import passport from "passport";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { getTokenFromHeader } from "../config/jwt";
import redisClient from "../config/redisClient";

export const requireAuth: RequestHandler = (req, res, next) => {
    try {
        if (!req.user) {
            throw createHttpError(401, "unauthorized")
        }
        next()
    } catch (error) {
        next(error)
    }
}

//export const requireAuthJwt = passport.authenticate('jwt', { session: false })

export const requireAuthJwt: RequestHandler = (req, res, next) => {
    try {
        passport.authenticate('jwt', function (err: Error, user: Express.User) {
            if (err) return next(err);
            if (!user) throw createHttpError(401, 'Unauthorized');
            req.user = user;
            next();
        }
        )(req, res, next);
    } catch (error) {
        next(error)
    }
}


export const validateExpirationJWT: RequestHandler = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req)
        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, { MATCH: `[^-]*-${token}`, COUNT: 1000 });
            if (result.keys.length > 0) {
                next()
            } else {
                throw createHttpError(401, "Unauthorized")
            }
            cursor = result.cursor;
        } while (cursor !== 0);

    } catch (error) {
        next(error)
    }
}

