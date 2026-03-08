# iReport - Bullying Reporting & Prevention System

A comprehensive mobile application for reporting and preventing bullying incidents in educational institutions.

## Features

- **Anonymous Reporting**: Students can report bullying incidents anonymously
- **Live Incident Response**: Real-time incident tracking and response system
- **Staff Management**: Admin and staff role management with customizable permissions
- **Student Management**: Grade levels, sections, and student profile management
- **Report Analytics**: Dashboard with incident analytics and trends
- **Multi-language Support**: English, Filipino, and Cebuano language support
- **Dark Mode**: Built-in dark theme support
- **AI Chatbot**: Groq-powered AI assistant for guidance and support

## Tech Stack

- **Frontend**: React Native with Expo
- **Routing**: Expo Router
- **State Management**: React Query + Context API
- **UI Components**: Lucide React Native & React Native
- **Language**: TypeScript
- **Storage**: AsyncStorage
- **AI Integration**: Groq SDK

## Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`

### Setup

1. Clone the repository:
```bash
cd iReport
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Groq API key to the `.env` file:
```env
EXPO_PUBLIC_GROQ_API_KEY=your_api_key_here
```

## Running the Application

### Development Server
```bash
npm start
```

### iOS (Mac only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Project Structure

```
iReport/
├── components/          # Reusable UI components
├── constants/           # App constants and configurations
├── contexts/            # React Context for state management
├── app/                 # Expo Router app structure
│   ├── admin/          # Admin screens
│   ├── student/        # Student screens
│   ├── teacher/        # Teacher screens
│   └── ...
├── types/              # TypeScript type definitions
├── assets/             # Images, icons, fonts
└── package.json        # Dependencies and scripts
```

## Key Contexts

- **AuthContext**: User authentication and authorization
- **ReportContext**: Incident report data management
- **StudentsContext**: Student data and grade/section management
- **StaffContext**: Staff member data management
- **SettingsContext**: User preferences (theme, language, etc.)
- **SettingsContext**: Application-wide settings
- **BuildingsContext**: School building and location data
- **LiveReportsContext**: Real-time incident tracking

## User Roles

- **Admin**: Full system access and management
- **Principal**: Administrative and reporting oversight
- **Guidance Counselor**: Report review and student support
- **Teacher**: Report submission and incident reporting
- **Student**: Anonymous incident reporting

## Environment Variables

```
EXPO_PUBLIC_GROQ_API_KEY  - Your Groq API key for the AI chatbot
EXPO_PUBLIC_API_URL       - Backend API URL
```

## Development

### Type Checking
```bash
npm run type-check
```

### Running Tests
```bash
npm test
```

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m 'Add my feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Open a Pull Request

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.

## Changelog

### Version 1.0.0
- Initial release
- Core reporting functionality
- Admin dashboard
- Role-based access control
- Multi-language support
- AI chatbot integration
