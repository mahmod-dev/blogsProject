import { Sequelize } from "sequelize-typescript"
import env from "../env"

const sequelize = new Sequelize(env.DB_NAME, env.DB_USERNAME, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port:env.DB_PORT,
    dialect: 'postgres',
    models: [__dirname + "/models"],
   /* pool: {
        max: 100,
        min: 0,
        idle: 200000,
        // @note https://github.com/sequelize/sequelize/issues/8133#issuecomment-359993057
        acquire: 1000000,
      },*/
})


export default sequelize;
