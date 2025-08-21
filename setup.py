import os
import json

# Create all directories
directories = [
    'docs', 'scripts', 'frontend/public', 'frontend/src', 'backend', 
    'database/migrations', 'database/seeds'
]

for directory in directories:
    os.makedirs(directory, exist_ok=True)
    print(f"✓ Created directory: {directory}")

# Create root package.json
root_package = {
    "name": "rera-quotation-system",
    "version": "1.0.0",
    "description": "RERA Services Quotation Management System",
    "private": True,
    "scripts": {
        "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
        "dev:frontend": "cd frontend && npm start",
        "dev:backend": "cd backend && npm run dev",
        "build": "cd frontend && npm run build",
        "start": "cd backend && npm start"
    },
    "devDependencies": {
        "concurrently": "^8.2.0",
        "@supabase/supabase-js": "^2.38.0",
        "dotenv": "^16.3.1"
    }
}

with open('package.json', 'w') as f:
    json.dump(root_package, f, indent=2)
print("✓ Created root package.json")

# Create frontend package.json
frontend_package = {
    "name": "rera-quotation-frontend",
    "version": "1.0.0",
    "private": True,
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1",
        "react-router-dom": "^6.8.1",
        "@supabase/supabase-js": "^2.38.0",
        "axios": "^1.3.4",
        "react-hot-toast": "^2.4.1"
    },
    "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test"
    },
    "proxy": "http://localhost:3001"
}

with open('frontend/package.json', 'w') as f:
    json.dump(frontend_package, f, indent=2)
print("✓ Created frontend/package.json")

# Create backend package.json
backend_package = {
    "name": "rera-quotation-backend",
    "version": "1.0.0",
    "main": "server.js",
    "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js"
    },
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "bcrypt": "^5.1.0",
        "jsonwebtoken": "^9.0.2",
        "@supabase/supabase-js": "^2.38.0",
        "dotenv": "^16.3.1",
        "helmet": "^7.0.0"
    },
    "devDependencies": {
        "nodemon": "^3.0.1"
    }
}

with open('backend/package.json', 'w') as f:
    json.dump(backend_package, f, indent=2)
print("✓ Created backend/package.json")

# Create basic files
with open('frontend/src/App.js', 'w') as f:
    f.write('''import React from 'react';

function App() {
  return (
    <div style={{textAlign: 'center', padding: '50px'}}>
      <h1>RERA Quotation System</h1>
      <p>Setup Complete! System is ready for development.</p>
    </div>
  );
}

export default App;''')

with open('frontend/src/index.js', 'w') as f:
    f.write('''import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);''')

with open('frontend/public/index.html', 'w') as f:
    f.write('''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RERA Quotation System</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>''')

with open('backend/server.js', 'w') as f:
    f.write('''const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});''')

print("\n🎉 Basic project structure created!")
print("\nNext steps:")
print("1. Run: npm install")
print("2. Run: npm run dev")
