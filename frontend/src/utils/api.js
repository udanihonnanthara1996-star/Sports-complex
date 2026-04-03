import axios from 'axios';

// Create an axios instance with base configuration
const API = axios.create({
  baseURL: 'http://localhost:5000',
});

// Global error handler for uncaught errors
const globalErrorHandler = (event) => {
  console.group("🚨 Global Error Handler");
  console.log("Uncaught error:", event.error);
  console.log("Error message:", event.message);
  console.groupEnd();
};

// Add global error listener
if (typeof window !== 'undefined') {
  window.addEventListener('error', globalErrorHandler);
  window.addEventListener('unhandledrejection', event => {
    console.group("🚨 Unhandled Promise Rejection");
    console.log("Promise:", event.promise);
    console.log("Reason:", event.reason);
    console.groupEnd();
    // Prevent the default browser behavior
    event.preventDefault();
  });
}

// Helper function to safely stringify objects with circular references
const safeStringify = (obj, space = 2) => {
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, (key, val) => {
      if (val != null && typeof val == "object") {
        if (seen.has(val)) {
          return "[Circular Reference]";
        }
        seen.add(val);
      }
      return val;
    }, space);
  } catch (e) {
    return "[Stringify Error]: " + e.message;
  }
};

// Error handling helper
const handleError = (error) => {
  console.group("🛑 API Error Handler");
  
  // Safely log the error object
  try {
    if (error && typeof error === 'object') {
      console.log("Full Error Object:", safeStringify(error));
    } else {
      console.log("Error:", error);
    }
  } catch (e) {
    console.log("Error (could not stringify):", error?.message || String(error));
  }

  if (error?.response) {
    console.log("📡 Response Data:", error.response.data);
    console.log("Status:", error.response.status);
    console.log("Headers:", error.response.headers);
  } else if (error?.request) {
    console.log("🌐 Request made but no response received:", error.request);
  } else if (error?.message) {
    console.log("⚠️ Error Message:", error.message);
  } else {
    console.log("⚠️ Unknown Error:", error);
  }

  console.groupEnd();
};

// Add a request interceptor to include auth token
API.interceptors.request.use(
  (config) => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || 'null');
      if (auth && auth.token) {
        config.headers['Authorization'] = `Bearer ${auth.token}`;
      }
    } catch (e) {
      console.warn("Failed to parse auth token:", e);
    }
    return config;
  },
  (error) => {
    handleError(error);
    return Promise.reject(new Error(error?.message || 'Request error'));
  }
);

// Add a response interceptor to handle errors consistently
API.interceptors.response.use(
  (response) => response,
  (error) => {
    handleError(error);

    // Create a clean error object to avoid circular references
    let errorMessage = 'An unexpected error occurred';
    let errorStatus = 500;
    
    if (error?.response) {
      errorStatus = error.response.status;
      errorMessage = error.response.data?.error || 
                    error.response.data?.message || 
                    error.response.statusText || 
                    `HTTP Error ${errorStatus}`;
    } else if (error?.request) {
      errorMessage = 'No response received from server';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Handle 401 errors
    if (errorStatus === 401) {
      try {
        localStorage.removeItem('auth');
      } catch (e) {
        console.warn("Failed to clear auth:", e);
      }
    }

    // Return a clean error without circular references
    const cleanError = new Error(errorMessage);
    cleanError.status = errorStatus;
    return Promise.reject(cleanError);
  }
);

export default API;