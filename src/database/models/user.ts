import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, HasMany, DefaultScope } from "sequelize-typescript"
import BlogPostModel from "./blogPost"

export interface User {
    _id: string,
    username?: string,
    displayName?: string,
    email?: string,
    password?: string,
    googleId?: string,
    githubId?: string,
    profilePicUrl?: string,
    about?: string,
    createdAt?: string,
    updatedAt?: string,
}
@DefaultScope(() => ({
    attributes: ['_id', 'username', 'email', 'profilePicUrl', 'about', 'displayName'],

}))
@Table({
    timestamps: true,
    tableName: "user",
})
class UserModel extends Model {

    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare _id: string

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    declare username: string


    @Column({
        type: DataType.STRING,
        validate: {
            isEmail: true
        }
    })
    declare email: string

    @Column({
        type: DataType.TEXT,
    })
    declare profilePicUrl: string

    @Column({
        type: DataType.STRING,
    })
    declare password: string

    @Column({
        type: DataType.STRING,
    })
    declare googleId: string

    @Column({
        type: DataType.STRING,
    })
    declare githubId: string

    @Column({
        type: DataType.STRING,
    })
    declare displayName: string

    @Column({
        type: DataType.STRING,
    })
    declare about: string

    @CreatedAt
    declare createdAt: Date

    @UpdatedAt
    declare updatedAt: Date

    @HasMany(() => BlogPostModel)
    declare posts: BlogPostModel[];

}

export default UserModel