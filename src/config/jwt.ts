import { Request, Response, NextFunction } from "express";
import redisClient from "./redisClient";
import assertIsDefined from "../utils/assertIsDefined";
import mongoose from "mongoose";
import passport from "passport";
import createHttpError from "http-errors";


export async function setActivelistToken(objectId: mongoose.Types.ObjectId, token: string) {
    const userId = objectId.toString()
    const key = "sess:" + userId.toString() + "-" + token

    await redisClient.set(key, userId);
}

export function getTokenFromHeader(req: Request) {
    const authorization = req.headers['authorization']
    assertIsDefined(authorization)
    return authorization.split(' ')[1];
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('jwt', function (err:Error, user:Express.User) {
        if (err) return next(err);
        if (!user) throw createHttpError(401, 'User is not authenticated.');
        req.user = user;
        next();
    })(req, res, next);
}