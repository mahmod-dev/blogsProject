import { cleanEnv, port, str } from "envalid";

const env = cleanEnv(process.env, {
    PORT: port(),
    MONGO_CONNECTION_URL: str(),
    SERVER_URL: str(),
    WEBSITE_URL: str(),
    SESSION_SECRET: str(),
    GOOGLE_CLIENT_ID: str(),
    GOOGLE_CLIENT_SECRET: str(),
    GITHUB_CLIENT_ID: str(),
    GITHUB_CLIENT_SECRET: str(),
    SMTP_PASSWORD: str(),
    NODE_ENV: str(),
    JWT_SECRET: str(),
})

export default env

