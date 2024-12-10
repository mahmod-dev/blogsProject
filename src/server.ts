import mongoose from "mongoose"
import app from "./app";
import env from "./env"

const port = env.PORT

mongoose.connect(env.MONGO_CONNECTION_URL)
    .then(() => {
        console.log("Mongoose connected successfully");
        app.listen(port, () => {
            console.log("server ruuning on port: " + port)
        })
    })
    .catch(console.error)