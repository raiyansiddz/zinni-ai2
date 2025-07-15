require('dotenv').config();

const config = {
    // Backend API Configuration
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8001',
    
    // Neon Auth Configuration
    NEON_AUTH: {
        PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || '9474a952-de9c-424b-830f-c78480058e0b',
        PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || 'pck_176ayrqy7wzj62wynjxj18gad9qjm70v07b1k6aa40cxg',
        SERVER_KEY: process.env.STACK_SECRET_SERVER_KEY || 'ssk_xa69r3t17n9hsmbdw6wzrjkp3pytn45vhmnbt3pbqjwrr',
        AUTH_URL: 'https://accounts.stack-auth.com/sign-in'
    },
    
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Debug flag
    DEBUG: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development'
};

// Log configuration in development
if (config.DEBUG) {
    console.log('[Environment] Configuration loaded:');
    console.log('  - BACKEND_URL:', config.BACKEND_URL);
    console.log('  - NEON_AUTH.PROJECT_ID:', config.NEON_AUTH.PROJECT_ID);
    console.log('  - NEON_AUTH.PUBLISHABLE_KEY:', config.NEON_AUTH.PUBLISHABLE_KEY.substring(0, 20) + '...');
    console.log('  - NODE_ENV:', config.NODE_ENV);
}

module.exports = config;