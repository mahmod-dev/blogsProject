import mongoose from "mongoose"
import env from "../env"
import redisClient from "../config/redisClient"

export async function destroyAllActiveSessionsForUser(userId: string) {
    return env.NODE_ENV === "production" ? redisConnection(userId) : mongoConnection(userId)
}

function mongoConnection(userId: string) {
    const regexp = new RegExp("^" + userId)
    mongoose.connection.db?.collection("sessions").deleteMany({ _id: regexp })
}

async function redisConnection(userId: string) {
    let cursor = 0;
    do {
        const result = await redisClient.scan(cursor, { MATCH: `sess:${userId}*`, COUNT: 1000 });
        for (const key of result.keys) {
            await redisClient.del(key);
        }
        cursor = result.cursor;
    } while (cursor !== 0);
}