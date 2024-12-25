import { Request } from "express";
import redisClient from "./redisClient";
import assertIsDefined from "../utils/assertIsDefined";

export async function setActivelistToken(userId: string, token: string) {
    const key = "sess:" + userId + "_" + token
    console.log(key);
    
    await redisClient.set(key, userId);
}

export function getTokenFromHeader(req: Request) {
    const authorization = req.headers['authorization']
    assertIsDefined(authorization)
    return authorization.split(' ')[1];
}

