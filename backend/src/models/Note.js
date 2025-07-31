import mongoose from "mongoose";

// 1st step: create a schema
// 2nd step: create a model based of that schema

const noteSchema = new mongoose.Schema(
    {
        title:{
            type: String,
            required: true,
        },
        content:{
            type:String,
            required: true,
        },
    },
    { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema)

export default Note