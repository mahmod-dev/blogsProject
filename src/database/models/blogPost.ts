import { BelongsTo, Column, DataType, DefaultScope, ForeignKey, HasMany, Model, Scopes, Table } from "sequelize-typescript";
import UserModel from "./user";
import CommentModel from "./comment";


@DefaultScope(() => ({
    include: [UserModel],

}))
@Scopes(() => ({
    withComment: { include: [CommentModel] }

}))
@Table({
    timestamps: true,
    tableName: "blogPost",
})
class BlogPostModel extends Model {
    // @Column({
    //     primaryKey: true,
    //     autoIncrement: true
    // })
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare _id: number

    @Column({
        allowNull: false,
        unique: true
    })
    declare slug: string

    @Column({
        allowNull: false,
    })
    declare title: string

    @Column({
        allowNull: false,
    })
    declare summary: string

    @Column({
        allowNull: false,
    })
    declare body: string

    @Column({
        allowNull: false,
    })
    declare imgUrl: string

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare authorId: string

    @BelongsTo(() => UserModel)
    declare user: UserModel

    @HasMany(() => CommentModel)
    declare comments: CommentModel[];

}

export default BlogPostModel