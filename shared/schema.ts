import { z } from "zod";

// MongoDB schemas using Zod
export const productSchema = z.object({
  _id: z.string().optional(),
  productName: z.string(),
  brand: z.string(),
  price: z.string(),
  discountPrice: z.string(),
  imageUrl: z.string(),
  quantity: z.string(),
  category: z.string(),
  subCategory: z.string(),
  absoluteUrl: z.string(),
});

export const insertProductSchema = productSchema.omit({
  _id: true,
});

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export const userSchema = z.object({
  _id: z.string().optional(),
  username: z.string(),
  password: z.string(),
});

export const insertUserSchema = userSchema.pick({
  username: true,
  password: true,
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
