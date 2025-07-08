import mongoose from 'mongoose';

// MongoDB connection string - using a local MongoDB or MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/walmart_catalog';

let isConnected = false;

export const connectToMongoDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Product schema for MongoDB
const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: String, required: true },
  discountPrice: { type: String, required: true },
  imageUrl: { type: String, required: true },
  quantity: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  absoluteUrl: { type: String, required: true },
}, {
  timestamps: true
});

// Create indexes for better search performance
productSchema.index({ productName: 'text', brand: 'text', category: 'text' });
productSchema.index({ category: 1 });

export const ProductModel = mongoose.model('Product', productSchema);