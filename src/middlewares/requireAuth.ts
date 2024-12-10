import { RequestHandler } from "express";
import createHttpError from "http-errors";

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