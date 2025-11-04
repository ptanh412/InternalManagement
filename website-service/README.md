# Website Service - Internal Management System

A modern, responsive website frontend built with React.js and Tailwind CSS for the Internal Management System.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Authentication**: Secure user authentication and authorization
- **Dashboard**: Comprehensive dashboard with analytics and quick actions
- **Project Management**: Project overview and management capabilities
- **Team Collaboration**: Team member management and communication tools
- **Task Tracking**: Task creation, assignment, and progress monitoring
- **Responsive Design**: Mobile-first approach for all screen sizes
- **Performance Optimized**: Fast loading with code splitting and lazy loading

## 🛠 Tech Stack

- **Frontend Framework**: React 18.3.1
- **Styling**: Tailwind CSS 3.3.5
- **Icons**: Heroicons 2.0.18
- **Routing**: React Router DOM 6.23.1
- **HTTP Client**: Axios 1.7.2
- **State Management**: React Context API
- **Build Tool**: React Scripts 5.0.1

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the environment variables:
   ```
   REACT_APP_API_URL=http://localhost:8080/api
   REACT_APP_ENVIRONMENT=development
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🏗 Project Structure

```
website-service/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.js
│   │   └── Footer.js
│   ├── pages/            # Page components
│   │   ├── Home.js
│   │   ├── About.js
│   │   ├── Services.js
│   │   ├── Contact.js
│   │   ├── Login.js
│   │   └── Dashboard.js
│   ├── hooks/            # Custom React hooks
│   │   └── useAuth.js
│   ├── services/         # API services
│   │   └── apiService.js
│   ├── utils/            # Utility functions
│   │   └── helpers.js
│   ├── App.js            # Main app component
│   ├── index.js          # Entry point
│   └── index.css         # Global styles
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Dependencies and scripts
```

## 🎨 Design System

### Colors
- **Primary**: Blue shades (#3B82F6 family)
- **Secondary**: Gray shades (#64748B family)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700

### Components
- **Buttons**: `.btn-primary`, `.btn-secondary`
- **Cards**: `.card`
- **Input Fields**: `.input-field`

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8080/api` |
| `REACT_APP_ENVIRONMENT` | Environment name | `development` |

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## 🔐 Authentication

The application uses JWT-based authentication with the following features:

- **Login/Logout**: Secure user authentication
- **Token Management**: Automatic token refresh and validation
- **Protected Routes**: Route-level access control
- **Role-based Access**: Different access levels for different user roles

## 🚦 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration can be found in `tailwind.config.js`.

### API Integration
API calls are centralized in `src/services/apiService.js`. The service includes:
- Automatic token management
- Request/response interceptors
- Error handling
- Timeout configuration

## 📊 Performance

- **Code Splitting**: Automatic code splitting with React.lazy()
- **Asset Optimization**: Optimized images and assets
- **Bundle Analysis**: Use `npm run build` to analyze bundle size
- **Caching**: Service worker caching for offline support

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Test files should follow the naming convention: `*.test.js` or `*.spec.js`

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔗 Integration

This website service integrates with:

- **API Gateway**: Routes requests through the central gateway
- **Identity Service**: User authentication and authorization
- **Notification Service**: Real-time notifications
- **File Service**: File upload and management

## 📝 License

This project is part of the Internal Management System and is proprietary software.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request

## 📞 Support

For technical support, contact the development team or create an issue in the project repository.