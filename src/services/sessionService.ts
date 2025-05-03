/**
 * Session management service for persisting user state between visits
 */

// Session storage keys
export const SESSION_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_SETTINGS: 'user_settings',
  CAMERA_PREFERENCES: 'camera_preferences',
  TRACE_IMAGE: 'traceImage',
  LAST_ACTIVE: 'last_active_timestamp',
  WEBRTC_SESSION: 'webrtc_session'
};

// Camera preferences type
export interface CameraPreferences {
  deviceId?: string;
  isFrontCamera: boolean;
  brightness: number;
  contrast: number;
  enabled: boolean;
}

// Default camera preferences
export const DEFAULT_CAMERA_PREFERENCES: CameraPreferences = {
  deviceId: undefined,
  isFrontCamera: false,
  brightness: 100,
  contrast: 100,
  enabled: true
};

/**
 * Save camera preferences to session storage
 */
export const saveCameraPreferences = (preferences: CameraPreferences): void => {
  try {
    sessionStorage.setItem(SESSION_KEYS.CAMERA_PREFERENCES, JSON.stringify(preferences));
    // Also save to localStorage for persistence between sessions
    localStorage.setItem(SESSION_KEYS.CAMERA_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving camera preferences:', error);
  }
};

/**
 * Load camera preferences from storage
 */
export const loadCameraPreferences = (): CameraPreferences => {
  try {
    // Try to get from sessionStorage first
    let prefsString = sessionStorage.getItem(SESSION_KEYS.CAMERA_PREFERENCES);
    
    // If not found in sessionStorage, try localStorage
    if (!prefsString) {
      prefsString = localStorage.getItem(SESSION_KEYS.CAMERA_PREFERENCES);
      
      // If found in localStorage, also set in sessionStorage for faster access
      if (prefsString) {
        sessionStorage.setItem(SESSION_KEYS.CAMERA_PREFERENCES, prefsString);
      }
    }
    
    return prefsString ? JSON.parse(prefsString) : DEFAULT_CAMERA_PREFERENCES;
  } catch (error) {
    console.error('Error loading camera preferences:', error);
    return DEFAULT_CAMERA_PREFERENCES;
  }
};

/**
 * Update the last active timestamp
 */
export const updateLastActive = (): void => {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVE, timestamp);
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
  }
};

/**
 * Get the last active timestamp
 */
export const getLastActive = (): Date | null => {
  try {
    const timestamp = localStorage.getItem(SESSION_KEYS.LAST_ACTIVE);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last active timestamp:', error);
    return null;
  }
};

/**
 * Clear all session data
 */
export const clearSessionData = (): void => {
  try {
    // Keep camera preferences but clear other session data
    const cameraPrefs = loadCameraPreferences();
    sessionStorage.clear();
    saveCameraPreferences(cameraPrefs);
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
};

/**
 * Initialize session tracking
 * Call this when the app starts
 */
export const initSession = (): void => {
  updateLastActive();
  
  // Set up interval to update last active timestamp
  setInterval(updateLastActive, 60000); // Update every minute
  
  // Set up event listeners to update last active on user interaction
  window.addEventListener('click', updateLastActive);
  window.addEventListener('keydown', updateLastActive);
  window.addEventListener('mousemove', updateLastActive);
  window.addEventListener('touchstart', updateLastActive);
};
