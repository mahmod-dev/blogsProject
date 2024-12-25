import "dotenv/config"
import database from "./database/connection"
import app from "./app";
import env from "./env";

const port = env.PORT
database.authenticate().then(() => {
    console.log("database connected successfully");
}).catch(console.error)

database.sync().then(() => {
    console.log("database has been synced");
    app.listen(port, () => {
        console.log("server ruuning on port: " + port)
    })
}).catch(console.error)

