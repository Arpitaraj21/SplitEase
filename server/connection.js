import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODBURL}/application`).then(() => {
      console.log("Connected to database successfully");
    });
  } catch (error) {
    console.log("Error connecting to database", error);
    process.exit();
  }
};

export default connectDb;
