import { AfterFind, BelongsTo, Column, DataType, DefaultScope, ForeignKey, Model, Scopes, Table } from "sequelize-typescript";
import UserModel from "./user";
import BlogPostModel from "./blogPost";

@DefaultScope(() => ({
    include: [UserModel],

}))
@Scopes(() => ({
    withBlogPost: { include: [BlogPostModel] }

}))
@Table({
    timestamps: true,
    tableName: "comment"
})
class CommentModel extends Model {
    @Column({
        primaryKey: true,
        autoIncrement:true
    })
    declare _id: number

    @Column({
        allowNull: false,
    })
    declare text: string

    @Column({
        type: DataType.INTEGER,
    })
    declare parentCommentId: number

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare authorId: string

    @BelongsTo(() => UserModel)
    declare user: UserModel

    @ForeignKey(() => BlogPostModel)
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare blogPostId: string

    @BelongsTo(() => BlogPostModel)
    declare blogPost: BlogPostModel

    @AfterFind
    static async addRepliesCount(instances: CommentModel | CommentModel[]) {
        const addCount = async (instance: CommentModel) => {
            if (instance._id) {
                const count = await CommentModel.count({
                    where: { parentCommentId: instance._id },
                });
                instance.setDataValue("repliesCount", count);
            }
        };

        if (Array.isArray(instances)) {
            await Promise.all(instances.map((instance) => addCount(instance)));
        } else if (instances) {
            await addCount(instances);
        }
    }
}
export default CommentModel