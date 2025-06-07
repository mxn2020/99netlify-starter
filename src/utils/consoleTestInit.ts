import { testProfileUpdate, testViewportSize, testNavigationLayout, testPerformance } from './testHelpers';
import { qstashApi } from './api/qstash';
import { User } from '../types';

// QStash test function
const testQStash = async () => {
  console.group('🚀 Testing QStash Integration');
  
  try {
    // Test 1: Get tasks
    console.log('📝 Testing task retrieval...');
    const tasksResponse = await qstashApi.getTasks();
    console.log('✅ Tasks retrieved:', tasksResponse.data);

    // Test 2: Schedule welcome email
    console.log('📧 Testing welcome email scheduling...');
    const welcomeResponse = await qstashApi.scheduleWelcomeEmail({
      email: 'test@example.com',
      name: 'Test User'
    });
    console.log('✅ Welcome email scheduled:', welcomeResponse.data);

    // Test 3: Schedule custom task
    console.log('⚙️ Testing custom task scheduling...');
    const customTaskResponse = await qstashApi.scheduleTask({
      type: 'notification',
      payload: {
        userId: 'test-user',
        message: 'Console test notification',
        type: 'info'
      }
    });
    console.log('✅ Custom task scheduled:', customTaskResponse.data);

    console.log('🎉 All QStash tests passed!');
    return {
      success: true,
      tasks: tasksResponse.data,
      welcomeEmail: welcomeResponse.data,
      customTask: customTaskResponse.data
    };

  } catch (error) {
    console.error('❌ QStash test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    console.groupEnd();
  }
};

interface AppTestWindow extends Window {
  appTests: {
    testProfileUpdate: () => Promise<unknown>;
    testViewportSize: () => unknown;
    testNavigationLayout: () => unknown;
    testPerformance: () => unknown;
    testQStash: () => Promise<unknown>;
    runAllTests: () => Promise<unknown>;
    help: () => void;
  };
}

/**
 * Initialize test commands in the browser console for easy testing
 * @param updateUserFn - The function to update the user
 * @param currentUser - The current logged in user
 */
export const initConsoleTests = (
  updateUserFn: (userData: Partial<User>) => Promise<User | undefined>,
  currentUser: User | null | undefined
) => {
  // Add tests to window object for console access
  if (typeof window !== 'undefined') {
    (window as unknown as AppTestWindow).appTests = {
      testProfileUpdate: () => testProfileUpdate(updateUserFn, currentUser),
      testViewportSize,
      testNavigationLayout: () => testNavigationLayout(currentUser, updateUserFn),
      testPerformance,
      testQStash,
      runAllTests: async () => {
        console.group('🧪 Running All Tests');

        console.log('📱 Testing Viewport Size');
        const viewportResult = testViewportSize();
        console.log(viewportResult);

        console.log('🧑‍💼 Testing Profile Update');
        const profileResult = await testProfileUpdate(updateUserFn, currentUser);
        console.log(profileResult);

        console.log('🧭 Testing Navigation Layout');
        const navInfo = testNavigationLayout(currentUser, updateUserFn);
        console.log({
          currentLayout: navInfo.currentLayout,
          newLayout: navInfo.newLayout,
        });

        console.log('⚡ Testing Performance');
        const performanceResult = testPerformance();
        console.log(performanceResult);

        console.log('🚀 Testing QStash');
        const qstashResult = await testQStash();
        console.log(qstashResult);

        console.groupEnd();

        return {
          viewport: viewportResult,
          profile: profileResult,
          navigation: navInfo,
          performance: performanceResult,
          qstash: qstashResult
        };
      },
      help: () => {
        console.group('🧪 Test Suite Commands');
        console.log('appTests.testProfileUpdate() - Test if profile updates work');
        console.log('appTests.testViewportSize() - Check viewport dimensions and breakpoints');
        console.log('appTests.testNavigationLayout() - Get navigation layout info');
        console.log('appTests.testPerformance() - Measure app performance metrics');
        console.log('appTests.testQStash() - Test QStash task queue functionality');
        console.log('appTests.runAllTests() - Run all tests');
        console.groupEnd();
      }
    };

    console.log('%c🧪 App Test Suite Initialized!', 'color: purple; font-weight: bold; font-size: 14px;');
    console.log('Type %cappTests.help()%c to see available commands', 'font-weight: bold; color: blue;', 'font-weight: normal;');
  }
};

export default initConsoleTests;
