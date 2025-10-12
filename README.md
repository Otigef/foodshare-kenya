# FoodShare Kenya 🍽️

A comprehensive web application for reducing food waste by connecting food donors with recipients in Kenya. Built with modern web technologies to facilitate efficient food distribution and community impact.

## 🌟 Features

- **Food Donation Management**: Donors can post available food with details, quantities, and pickup locations
- **Smart Food Discovery**: Recipients can browse available donations with filtering and search capabilities
- **Real-time Alerts**: Custom food alerts notify users when specific food types become available
- **Claims System**: Structured process for claiming donations with donor-recipient coordination
- **Admin Dashboard**: Complete management system for users, donations, and claims
- **Impact Tracking**: Visual analytics showing community impact and food waste reduction
- **Role-based Access**: Secure authentication with donor, recipient, and admin roles
- **Mobile-responsive**: Optimized for all devices and screen sizes

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or later) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn package manager
- Supabase account for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/foodshare-kenya.git
   cd foodshare-kenya
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the database migrations from `supabase/migrations/`
   - Enable Row Level Security (RLS) on all tables

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:8080`

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── admin/           # Admin-specific components
│   └── ...              # Feature components
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── integrations/        # Third-party integrations
│   └── supabase/        # Supabase client and types
└── assets/              # Static assets
```

## 🔐 Authentication & Security

- Email/password authentication via Supabase Auth
- Row Level Security (RLS) policies for data protection
- Role-based access control (donor, recipient, admin)
- Secure API endpoints with user authorization

## 📊 Database Schema

### Core Tables
- **profiles**: User profile information and roles
- **food_donations**: Food donation listings
- **donation_claims**: Claims on donations by recipients
- **food_alerts**: User notification preferences

### Enums
- **user_role**: 'donor', 'recipient', 'admin'
- **food_category**: 'fruits', 'vegetables', 'grains', etc.
- **donation_status**: 'available', 'claimed', 'completed', 'expired'
- **claim_status**: 'pending', 'approved', 'completed', 'cancelled'

## 🔧 API Endpoints

### Public Functions
- `get_public_donations()`: Fetch available food donations
- `get_public_profile_info(uuid)`: Get public profile information
- `get_donor_contact_for_claim(uuid)`: Get donor contact for approved claims

### Authentication Required
- Create, update, delete donations (donors only)
- Claim donations (recipients only)
- Manage users and system data (admins only)

## 🧪 Testing

Run the test suite:
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy to Lovable
1. Open your [Lovable Project](https://lovable.dev/projects/d0811739-14e5-456e-98b9-7433934e2903)
2. Click "Share" → "Publish"
3. Your app will be live at `https://foodshare-kenya.lovable.app`

### Custom Domain
Navigate to Project → Settings → Domains in Lovable to connect your custom domain.

## 🌍 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic HTML and accessible design
- Implement proper error handling
- Add tests for new features
- Update documentation

## 🔒 Security Considerations

- All user inputs are validated and sanitized
- Database queries use parameterized statements
- File uploads are restricted and validated
- Rate limiting on API endpoints
- HTTPS enforced in production

## 📈 Performance

- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle analysis and optimization
- CDN integration for static assets
- Database query optimization

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**Making a difference, one meal at a time** 🌟
