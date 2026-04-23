// URL base del backend - cambia automáticamente entre local y producción
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default API_URL;
