import { Schema, model } from "mongoose";
import mongoose from "mongoose";

export interface IFavYoutubeVideoSchema {
    title: string;
    description: string;
    thumbnail?: string;
    watched: boolean;
    youtuberName: string;
}

const FavYoutubeVideoSchema = new Schema<IFavYoutubeVideoSchema>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String },
    watched: { type: Boolean, default: false, required: true },
    youtuberName: { type: String, required: true },
});

const FavYoutubeVideoModel = model<IFavYoutubeVideoSchema>(
    "Fav-youtube-videos",
    FavYoutubeVideoSchema,
);
export default FavYoutubeVideoModel;