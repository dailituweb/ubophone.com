# Ubophone - International VoiceCall Platform

🌍 **Ubophone** is a modern international calling platform that provides high-quality voice calls worldwide with competitive rates and an intuitive user experience.

## ✨ Features

### 🚀 Core Functionality
- **International Calling** - High-quality voice calls to 200+ countries
- **Real-time Dialer** - Mobile-optimized dialer with intuitive interface  
- **Contact Management** - Organize and manage your contacts
- **Call History & Analytics** - Track your calling patterns and usage
- **Credit System** - Flexible prepaid credit system with bonus offers
- **Tutorial System** - Step-by-step guided tutorials for new users

### 📱 Mobile Experience
- **Bottom Navigation** - Native app-like navigation on mobile devices
- **Responsive Design** - Optimized for all screen sizes (320px - 4K)
- **Touch-Friendly** - Large touch targets and intuitive gestures
- **Progressive Web App** - Install on mobile devices for app-like experience

### 🎨 Modern UI/UX
- **Deep Green Theme** - Beautiful gradient design with #4ade80 accent
- **Glass Morphism** - Modern frosted glass effects throughout
- **Smooth Animations** - 60fps animations and transitions
- **Dark Mode Ready** - Optimized for low-light usage

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router 6** - Client-side routing and navigation
- **Styled Components** - CSS-in-JS with theme support
- **Lucide React** - Beautiful, consistent icon library
- **React Toastify** - User-friendly notifications

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, minimalist web framework
- **PostgreSQL (Neon)** - Cloud-native PostgreSQL database
- **Twilio API** - Voice calling infrastructure
- **JWT Authentication** - Secure user authentication

### DevOps & Deployment
- **Railway** - Modern application deployment platform
- **GitHub Actions** - Automated CI/CD pipeline
- **Environment Variables** - Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database (or Neon account)
- Twilio account for voice calling

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dailituweb/ubophone.com.git
cd ubophone.com
```

2. **Install dependencies**
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. **Environment Setup**
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
# - Database credentials (Neon PostgreSQL)
# - Twilio API credentials
# - JWT secret
# - Other settings
```

4. **Database Setup**
```bash
# Run database migrations
npm run migrate
```

5. **Development Mode**
```bash
# Start both client and server
npm run dev

# Or start separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

### Production Deployment

#### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy with automatic builds

#### Manual Deployment
```bash
# Build client
cd client && npm run build && cd ..

# Start production server
npm start
```

## 📁 Project Structure

```
ubophone.com/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API services
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                # Node.js backend application
│   ├── config/           # Database and service configs
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API route handlers
│   └── index.js          # Server entry point
├── .env.example          # Environment variables template
├── package.json          # Root package configuration
└── README.md             # Project documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=your_twilio_number

# Authentication
JWT_SECRET=your_jwt_secret

# Server Configuration
PORT=5000
NODE_ENV=production
```

## 📱 Mobile Features

### Bottom Navigation
- **Phone** - Access dialer and make calls
- **Contacts** - Manage your contact list
- **History** - View call history and analytics
- **Profile** - User dashboard and account settings

### Responsive Design Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

## 🎯 Key Pages

- **/** - Homepage with features and pricing
- **/phone** - Mobile-optimized dialer interface
- **/contacts** - Contact management system
- **/analytics** - Call history and usage analytics
- **/dashboard** - User profile and account overview
- **/buy-credits** - Credit purchase with payment integration

## 🔐 Security Features

- **JWT Authentication** - Secure user sessions
- **Environment Variables** - Sensitive data protection
- **Input Validation** - Prevent malicious inputs
- **Rate Limiting** - API abuse prevention
- **HTTPS Enforcement** - Encrypted connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Website**: [ubophone.com](https://ubophone.com)
- **Email**: support@ubophone.com
- **GitHub Issues**: [Create an issue](https://github.com/dailituweb/ubophone.com/issues)

## 🚀 Recent Updates

### v2.0 - Mobile Enhancement
- ✅ Added mobile bottom navigation
- ✅ Improved responsive design
- ✅ Enhanced user tutorial system
- ✅ Optimized call interface for mobile

### v1.5 - Platform Migration
- ✅ Migrated from MongoDB to PostgreSQL (Neon)
- ✅ Updated authentication system
- ✅ Improved error handling

---

**Built with ❤️ for global communication** 