// Client Configuration
const API_CONFIG = {
  // If served directly from the Express backend (localhost:5000), use same origin;
  // otherwise fallback to http://localhost:5000/api
  BASE_URL: (window.location.port === '5000' || window.location.origin.includes('5000'))
    ? `${window.location.origin}/api`
    : (localStorage.getItem('API_BASE_URL') || 'http://localhost:5000/api')
};

window.API_CONFIG = API_CONFIG;
