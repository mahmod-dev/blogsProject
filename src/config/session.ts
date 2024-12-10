import MongoStore from "connect-mongo";
import redisClient from "./redisClient";
import { SessionOptions } from "express-session";
import env from "../env";
import crypto from "crypto";
import { RedisStore } from "connect-redis";

const store = env.NODE_ENV === "production" ? new RedisStore({
    client: redisClient
}) : MongoStore.create({
    mongoUrl: env.MONGO_CONNECTION_URL
})

const sessionConfig: SessionOptions = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    rolling: true,
    store: store,
    genid(req) {
        const userId = req.user?._id;
        const randomId = crypto.randomUUID();
        if (userId) {
            return `${userId}-${randomId}`;
        } else {
            return randomId;
        }
    },
}

export default sessionConfig;