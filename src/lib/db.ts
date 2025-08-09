import mongoose from "mongoose";
import { ENV } from "@/lib/env";

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
}

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!global.mongooseConnection) {
    const uri = ENV.MONGODB_URI();
    mongoose.set("strictQuery", true);
    global.mongooseConnection = mongoose
      .connect(uri, {
        dbName: "dh_logistics",
      })
      .then((conn) => conn);
  }
  return global.mongooseConnection;
}
