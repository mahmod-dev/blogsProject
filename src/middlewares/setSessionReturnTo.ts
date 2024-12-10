import { RequestHandler } from "express";
import env from "../env";

const setSessionReturnTo: RequestHandler = (req, res, next) => {
    const { returnTo } = req.query
    if (returnTo) {
        req.session.returnTo = env.SERVER_URL + returnTo
    }
    next()
}

export default setSessionReturnTo