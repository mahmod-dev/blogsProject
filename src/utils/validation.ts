import mongoose from "mongoose";
import { DataType, isDataType, Sequelize } from "sequelize-typescript";
import { validateBufferMIMEType } from "validate-image-type";
import * as yup from "yup";
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

export const imageFileSchema = yup.mixed<Express.Multer.File>()
    .test(
        "valid-image",
        "The uploaded file is not a valid image",
        async file => {
            if (!file) return true;
            const result = await validateBufferMIMEType(file.buffer,
                {
                    allowMimeTypes: ["image/png", "image/jpeg"]
                });

            return result.ok;
        }
    );

export const objectIdSchema = yup.string().test(
    "is-object-id",
    "${path} is not a valid ObjectId",
    value => !value || uuidValidate(value) && uuidVersion(value) === 4
)




