const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  return mongoose.connect(process.env.MONGO_URI, {
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
  });
};

module.exports = connectDB;
