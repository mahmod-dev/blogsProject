import { literal, Op } from "sequelize";
import { Column, DataType, Model, Table, CreatedAt, UpdatedAt, DefaultScope, Scopes } from "sequelize-typescript";


@DefaultScope(() => ({
    where: {
        createdAt: {
            [Op.gte]: literal(`NOW() - INTERVAL '10 minutes'`)
        }
    }
}))

/*@Scopes(() => ({
    emailverification: {
        where: {
            emailType: 1, createdAt: {
                [Op.gte]: literal(`NOW() - INTERVAL '10 minutes'`)
            }
        }
    }
}))
@Scopes(() => ({
    resetPassword: {
        where: { emailType: 0 , createdAt: {
            [Op.gte]: literal(`NOW() - INTERVAL '10 minutes'`)
        }}
    }
}))*/
@Table({
    timestamps: true,
    tableName: "emailVerification"
})
class EmailVerificationModel extends Model {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare _id: number

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare verificationCode: string

    @Column({
        type: DataType.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    })
    declare email: string

    @CreatedAt
    declare createdAt: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare emailType: number // 1 emailverification, 2 reset password
}

export default EmailVerificationModel