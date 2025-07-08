import { type Product, type InsertProduct } from "@shared/schema";

export interface IStorage {
  getAllProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  initializeData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private currentId: number;

  constructor() {
    this.products = new Map();
    this.currentId = 1;
    this.loadCSVData();
  }

  private async loadCSVData() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Read the CSV file from attached_assets
      const csvPath = path.join(process.cwd(), 'attached_assets', 'BigBasket_1751813510063.csv');
      const csvData = fs.readFileSync(csvPath, 'utf-8');

      // Parse CSV data and load it into memory
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const product: Product = {
            _id: this.currentId.toString(),
            productName: values[0].replace(/"/g, ''),
            brand: values[1].replace(/"/g, ''),
            price: values[2].replace(/"/g, ''),
            discountPrice: values[3].replace(/"/g, ''),
            imageUrl: values[4].replace(/"/g, ''),
            quantity: values[5].replace(/"/g, ''),
            category: values[6].replace(/"/g, ''),
            subCategory: values[7].replace(/"/g, ''),
            absoluteUrl: values[8].replace(/"/g, ''),
          };
          this.products.set(product._id, product);
          this.currentId++;
        }
      }
      console.log(`Loaded ${this.products.size} products into memory`);
    } catch (error) {
      console.error('Error loading CSV data:', error);
      // Fallback to empty products map if file read fails
      this.products = new Map();
    }
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(product =>
      product.productName.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
    );
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product =>
      product.category === category
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId.toString();
    const product: Product = { ...insertProduct, _id: id };
    this.products.set(id, product);
    this.currentId++;
    return product;
  }

  async initializeData(): Promise<void> {
    // No-op for memory storage
  }
}

export const storage = new MemStorage();
