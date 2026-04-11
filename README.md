# Property Express | Premium Real Estate Portal 🏠✨

**Property Express** is a high-end, modern real estate platform designed for exclusive agencies to showcase premium properties (villas, apartments, plots, and commercial spaces). Built with **React** and **Firebase**, it features a sophisticated "Fluid Glassmorphism" UI and a robust Admin Portal for full content control.

---

## 🌟 Key Features

### Public Portal
- **Stunning UI/UX**: Implements modern design principles like glassmorphism, fluid animated backgrounds, and smooth scroll reveals.
- **GTA-Style Interactive Map**: Custom-designed Google Maps integration with price-tagged markers and radar animations.
- **Dynamic Property Grids**: Category-based filtering (Villa, Apartment, Plot, Commercial) with real-time data from Firestore.
- **Deep-Dive Property Details**: Multi-image galleries, automated sliders, comprehensive amenities lists, and in-depth descriptions.
- **Lead Generation**: Built-in inquiry forms on every property page and a floating WhatsApp contact bubble.
- **Advanced SEO**: Dynamic meta tags, Open Graph (OG) support, Twitter cards, and automated sitemaps/robots.txt.

### Admin Portal
- **Dashboard Overview**: Track property inventory, pending reviews, and recent customer leads at a glance.
- **Full Property Management**: A powerful interface to Add, Edit, and Delete property listings with multi-image support.
- **Inquiry Management**: View and manage all customer leads generated from the site.
- **Review System**: A dedicated section to moderate customer testimonials before they go live.
- **Global Settings**: Control site-wide metadata, SEO keywords, social media links, contact information, and business achievements.
- **Theme Control**: Built-in Dark/Light mode for the administrative interface.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with modern variables and Glassmorphism effects.
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend/DB**: [Firebase Firestore](https://firebase.google.com/docs/firestore), [Firebase Auth](https://firebase.google.com/docs/auth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **SEO**: [React Helmet Async](https://github.com/staylor/react-helmet-async)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Firebase project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vygridofficial/property-express-web.git
   cd property-express-web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
/
├── public/                 # Static assets (robots.txt, sitemap.xml, favicon)
├── src/
│   ├── admin/              # Full Admin Portal application
│   │   ├── components/     # Admin-specific components
│   │   ├── pages/          # Dashboard, Settings, Property Management, etc.
│   │   └── context/        # Admin-specific global state (AdminContext)
│   ├── components/         # Reusable public UI components (common & specific)
│   ├── pages/              # Public pages: Home, Properties, Detail, About, Contact
│   ├── services/           # Firebase/Firestore data service layers
│   ├── styles/             # Global CSS design system and variables
│   ├── utils/              # Helper functions (price formatting, geolocation, etc.)
│   ├── firebase.js         # Firebase initialization
│   ├── main.jsx            # Application entry point
│   └── App.jsx             # Root layout and route definitions
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite configuration
```

---

## 📈 SEO & Performance

- **Dynamic Head**: Handled via `react-helmet-async` on a per-page basis.
- **Structured Data**: JSON-LD scripts implemented for `RealEstateListing` and `RealEstateAgent`.
- **Crawling**: Optimized `robots.txt` and an automated `sitemap.xml`.
- **Assets**: Optimized image handling and lightweight Lucide icons.

---

## 🤝 Contributing

This project is maintained by **Property Express Team**. For inquiries or contributions, please contact the development team at [support@property-express.com](mailto:support@property-express.com).

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Designed and Developed with ❤️ by [Vygrid](https://vygrid.vercel.app/)*
