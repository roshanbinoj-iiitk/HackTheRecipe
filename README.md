# Walmart Product Catalog

A full-stack e-commerce product catalog built with React, Express.js, and TypeScript. Features 8000+ grocery products with search, filtering, and shopping cart functionality.

## Features

- 🛒 **Shopping Cart**: Add/remove items, adjust quantities, persistent storage
- 🔍 **Search**: Real-time product search by name, brand, or category
- 🏷️ **Filtering**: Category-based filtering and price sorting
- 📱 **Responsive**: Mobile-first design with Tailwind CSS
- 🎨 **Walmart Theme**: Blue/yellow branding with modern UI
- 💾 **Data Persistence**: Local storage for cart, in-memory product data

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query, React hooks
- **Styling**: Tailwind CSS with custom Walmart theme

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data management
│   └── index.ts           # Server entry point
├── shared/                 # Shared types/schemas
└── attached_assets/        # Product data (CSV)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Customization

### Adding Your Own Products

1. Replace `attached_assets/BigBasket_1751813510063.csv` with your product data
2. Ensure CSV format matches: ProductName, Brand, Price, DiscountPrice, Image_Url, Quantity, Category, SubCategory, Absolute_Url
3. Restart the server to load new data

### Theming

Edit `client/src/index.css` to customize colors:

```css
:root {
  --walmart-blue: hsl(207, 100%, 40%);
  --walmart-yellow: hsl(48, 100%, 56%);
  --walmart-dark-blue: hsl(207, 100%, 28%);
}
```

### Database Integration

The project currently uses in-memory storage. To add database persistence:

1. Uncomment MongoDB/PostgreSQL code in `server/storage.ts`
2. Install database dependencies
3. Configure connection string

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/search?q={query}` - Search products
- `GET /api/products/category/{category}` - Filter by category

## Deployment

### Local Production

```bash
npm run build
npm run start
```

### Cloud Deployment

This project is ready for deployment on:
- Vercel
- Netlify
- Railway
- Heroku
- Any Node.js hosting platform

Set `NODE_ENV=production` for production builds.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please create an issue in the repository or contact the maintainer.# HackTheRecipe
