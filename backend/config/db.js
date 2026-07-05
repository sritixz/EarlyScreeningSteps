import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI is not defined in the environment');
    }

    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
