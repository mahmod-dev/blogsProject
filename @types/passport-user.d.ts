import mongoose from "mongoose";

declare global {
    namespace Express {
        interface User {
            _id: string
        }
}
}