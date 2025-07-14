# Walmart Product Catalog

## AI-Powered Recipe Assistant

An AI-powered recipe assistant that auto-generates grocery lists from recipe names and adds items to the cart.

### The Problem

Customers often forget essential ingredients while shopping for recipes, leading to frustration and extra trips. While they may plan meals in advance, they either miss listing all items or forget minor ones like spices, condiments, or rarely used ingredients. This results in incomplete shopping and a poor cooking experience. The issue affects all types of customers, especially working individuals and students, and usually occurs during online grocery planning or in-store visits without a proper checklist.

### The Solution

We’re building an AI-based recipe assistant that takes the name of any dish (e.g., “lasagna” or “paneer butter masala”) and automatically extracts the full list of ingredients required using NLP and a recipe database. It cross-checks users’ current pantry items and compiles a complete grocery list, directly integrating it with the cart for quick checkout.

This is a full-stack e-commerce product catalog built with React (frontend) and FastAPI (backend). Features 27000+ grocery products with search, filtering, and shopping cart functionality.

## Features

- 💬 **Chat**: AI-powered recipe assistant for grocery list generation
- 🛒 **Shopping Cart**: Add/remove items, adjust quantities, persistent storage
- 🔍 **Search**: Real-time product search by name, brand, or category
- 🏷️ **Filtering**: Category-based filtering and price sorting
- 📱 **Responsive**: Mobile-first design with Tailwind CSS
- 🎨 **Walmart Theme**: Blue/yellow branding with modern UI
- 💾 **Data Persistence**: Local storage for cart, in-

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI (Python 3.10)
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query, React hooks
- **Styling**: Tailwind CSS with custom Walmart theme

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

#### Frontend (React)

1. **Navigate to the client directory and install dependencies**

   ```bash
   cd client
   npm install
   ```

2. **Start the React development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

---

#### Backend (FastAPI)

1. **Return to the project root and set up Python environment**

   Using Conda:

   ```bash
   cd ..
   conda create -p venv python=3.10 -y
   conda activate ./venv
   pip install -r requirements.txt
   ```

   **Alternative using Python venv:**

   ```bash
   cd ..
   python -m venv venv
   # On Linux/macOS:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up Gemini API key**

   - Create a `.env` file in the `fastapi_server` directory with:
     ```
     GEMINI_API_KEY=your-gemini-api-key
     ```

3. **Start the FastAPI backend**
   ```bash
   cd fastapi_server
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

---

#### Access the App

- Open your browser and navigate to `http://localhost:5173` to use

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
├── fastapi_server/         # FastAPI backend (Python)
│   ├── main.py             # API entry point
│   ├── cart.py, chat.py    # Backend modules
│   ├── models.py           # Data models
│   ├── storage.py          # Data management
│   ├── products.db         # (optional) SQLite DB
│   └── bigbasket_products.csv # Product data
└── attached_assets/        # Product data (CSV)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Customization

### Adding Your Own Products

1. Replace `attached_assets/bigbasket_products.csv` with your product data
2. Ensure CSV format matches: ProductID, ProductName, Brand, Price, DiscountPrice, Image_Url, Category, SubCategory, Absolute_Url
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
