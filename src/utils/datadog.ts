import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

export const initDatadog = () => {

  try {
    datadogRum.init({
      applicationId: '9970c695-c266-4f30-9479-4b5f9c8109d5',
      clientToken: 'pub90da71c1abe7f448b2c9bdd236d6f85c',
      site: 'us5.datadoghq.com',
      service: 'tower-vocabulary-game',
      env: 'prod',
      version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100, // Reduced for performance
      defaultPrivacyLevel: 'mask-user-input',
      plugins: [
        reactPlugin({ 
          router: false // We're not using React Router
        })
      ],
      // Track user interactions
      trackUserInteractions: true,
      // Track resources
      trackResources: true,
      // Track long tasks
      trackLongTasks: true,
    });

    console.log('Datadog RUM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Datadog RUM:', error);
  }
};

// Helper functions for custom tracking
export const trackGameEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    datadogRum.addAction(eventName, properties);
  } catch (error) {
    console.error('Failed to track game event:', error);
  }
};

export const trackGameError = (error: Error, context?: Record<string, any>) => {
  try {
    datadogRum.addError(error, context);
  } catch (err) {
    console.error('Failed to track error:', err);
  }
};

export const setUserContext = (userId: string | null, age?: number | string | null, gameId?: string | number | null) => {
  try {
    const userContext = {
      id: userId || 'anonymous',
      age: age ? String(age) : undefined,
      gameId: gameId ? String(gameId) : undefined,
    };
    
    datadogRum.setUser(userContext);
    
    console.log('Datadog user context set:', userContext);
  } catch (error) {
    console.error('Failed to set user context:', error);
  }
};

// Helper to add global context
export const addGlobalContext = (key: string, value: any) => {
  try {
    datadogRum.setGlobalContextProperty(key, value);
  } catch (error) {
    console.error('Failed to add global context:', error);
  }
};