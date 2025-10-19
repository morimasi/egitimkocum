import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        cookieFlags: 'SameSite=None;Secure'
      }
    });
    console.log('Google Analytics initialized');
  } else {
    console.warn('Google Analytics Measurement ID not found');
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path, title });
  }
};

// Track events
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  }
};

// Track custom events with parameters
export const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event(eventName, parameters);
  }
};

// Track user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.set(properties);
  }
};

// Track user ID
export const setUserId = (userId: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.set({ userId });
  }
};

// Track exceptions/errors
export const trackException = (description: string, fatal = false) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event('exception', {
      description,
      fatal
    });
  }
};

// Predefined event trackers for common actions
export const Analytics = {
  // Authentication events
  login: (method: string) => trackEvent('Authentication', 'Login', method),
  register: (role: string) => trackEvent('Authentication', 'Register', role),
  logout: () => trackEvent('Authentication', 'Logout'),

  // Assignment events
  createAssignment: () => trackEvent('Assignment', 'Create'),
  submitAssignment: () => trackEvent('Assignment', 'Submit'),
  gradeAssignment: () => trackEvent('Assignment', 'Grade'),
  
  // Student events
  addStudent: () => trackEvent('Student', 'Add'),
  viewStudentProfile: () => trackEvent('Student', 'View Profile'),
  
  // Message events
  sendMessage: (type: string) => trackEvent('Message', 'Send', type),
  createConversation: (isGroup: boolean) => 
    trackEvent('Message', 'Create Conversation', isGroup ? 'Group' : 'Direct'),
  
  // AI events
  useAIGeneration: (feature: string) => trackEvent('AI', 'Generate', feature),
  chatWithAI: () => trackEvent('AI', 'Chat'),
  
  // Library events
  uploadResource: (type: string) => trackEvent('Library', 'Upload', type),
  downloadResource: (type: string) => trackEvent('Library', 'Download', type),
  
  // Goal events
  createGoal: () => trackEvent('Goal', 'Create'),
  completeGoal: () => trackEvent('Goal', 'Complete'),
  
  // Exam events
  addExam: () => trackEvent('Exam', 'Add'),
  viewExamPerformance: () => trackEvent('Exam', 'View Performance'),
  
  // Gamification events
  earnXP: (amount: number) => trackEvent('Gamification', 'Earn XP', undefined, amount),
  earnBadge: (badgeId: string) => trackEvent('Gamification', 'Earn Badge', badgeId),
  levelUp: (level: number) => trackEvent('Gamification', 'Level Up', undefined, level),
  
  // Feature usage
  useFocusMode: (duration: number) => trackEvent('Feature', 'Focus Mode', undefined, duration),
  useAIPlanner: () => trackEvent('Feature', 'AI Planner'),
  
  // Errors
  error: (errorType: string, errorMessage: string) => 
    trackException(`${errorType}: ${errorMessage}`, false),
  criticalError: (errorType: string, errorMessage: string) => 
    trackException(`${errorType}: ${errorMessage}`, true),
};

export default Analytics;
