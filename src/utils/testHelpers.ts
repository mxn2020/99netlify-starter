import { User } from '../types';

interface PerformanceResourceTiming {
  initiatorType?: string;
  encodedBodySize?: number;
}

interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Helper function to test if the user profile update works correctly
 * This can be called from developer tools console or a test component
 */
export const testProfileUpdate = async (
  updateUserFn: (userData: Partial<User>) => Promise<User | undefined>,
  currentUser?: User | null
) => {
  if (!currentUser) {
    console.error('No user is currently logged in. Test cannot proceed.');
    return {
      success: false,
      message: 'No user is currently logged in'
    };
  }

  const currentFullName = `${currentUser.firstName} ${currentUser.lastName}`;
  const testFirstName = `${currentUser.firstName}_Test`;
  const testLastName = `${currentUser.lastName}_${new Date().toISOString().slice(0, 10)}`;
  const expectedFullName = `${testFirstName} ${testLastName}`;

  console.warn(`Testing profile update with names: ${testFirstName} ${testLastName}`);

  try {
    const updatedUser = await updateUserFn({
      firstName: testFirstName,
      lastName: testLastName
    });

    if (!updatedUser) {
      return {
        success: false,
        message: 'Update function returned undefined',
        originalValue: currentFullName
      };
    }

    const actualFullName = `${updatedUser.firstName} ${updatedUser.lastName}`;
    const success = actualFullName === expectedFullName;

    return {
      success,
      message: success
        ? `Profile update successful! Name changed to "${expectedFullName}"`
        : `Profile update failed. Expected "${expectedFullName}" but got "${actualFullName || 'undefined'}"`,
      originalValue: currentFullName,
      newValue: actualFullName
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: `Error during profile update test: ${error instanceof Error ? error.message : 'Unknown error'}`,
      originalValue: currentFullName,
      error
    };
  }
};

/**
 * Helper function to test if the browser viewport matches mobile requirements
 * Returns viewport information and if it's considered mobile
 */
export const testViewportSize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 768; // Common breakpoint for mobile devices

  return {
    width,
    height,
    isMobile,
    breakpoints: {
      sm: width >= 640,
      md: width >= 768,
      lg: width >= 1024,
      xl: width >= 1280,
      '2xl': width >= 1536
    }
  };
};

/**
 * Helper function to test navigation between sidebar and header layouts
 */
export const testNavigationLayout = (
  user: User | null | undefined,
  updateUserFn: (userData: Partial<User>) => Promise<User | undefined>
) => {
  if (!user) {
    return {
      success: false,
      message: 'No user is currently logged in. Test cannot proceed.'
    };
  }

  const currentLayout = user.preferences?.menuLayout || 'sidebar';
  const newLayout = currentLayout === 'sidebar' ? 'header' : 'sidebar';

  return {
    currentLayout,
    newLayout,
    switchLayout: async () => {
      try {
        const updatedUser = await updateUserFn({
          preferences: {
            ...user.preferences,
            menuLayout: newLayout
          }
        });

        return {
          success: Boolean(updatedUser),
          previousLayout: currentLayout,
          currentLayout: updatedUser?.preferences?.menuLayout || currentLayout,
          message: updatedUser
            ? `Successfully switched layout to ${updatedUser.preferences?.menuLayout}`
            : 'Failed to update layout preference'
        };
      } catch (error: unknown) {
        return {
          success: false,
          previousLayout: currentLayout,
          currentLayout,
          message: `Error switching layout: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  };
};

/**
 * Helper function to measure performance metrics of the application
 * @returns Performance metrics including load time, resource count, etc.
 */
export const testPerformance = () => {
  // Check if performance API is available
  if (typeof window === 'undefined' || !window.performance) {
    return {
      supported: false,
      message: 'Performance API not supported in this browser'
    };
  }

  // Get performance timing metrics
  const perfData = window.performance.timing;

  // Calculate key metrics
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const domReadyTime = perfData.domComplete - perfData.domLoading;
  const resourceLoadTime = perfData.loadEventEnd - perfData.domContentLoadedEventEnd;

  // Get resource information
  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  // Group resources by type
  const resourcesByType = resources.reduce((acc: Record<string, PerformanceResourceTiming[]>, resource: PerformanceResourceTiming) => {
    const type = resource.initiatorType || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(resource);
    return acc;
  }, {});

  // Calculate total resource size if available
  let totalResourceSize = 0;
  const resourceStats: Record<string, { count: number, size: number }> = {};

  Object.entries(resourcesByType).forEach(([type, items]) => {
    const encodedBodySize = items.reduce((sum, item: PerformanceResourceTiming) => sum + (item.encodedBodySize || 0), 0);
    resourceStats[type] = {
      count: items.length,
      size: encodedBodySize / 1024 // KB
    };
    totalResourceSize += encodedBodySize;
  });

  return {
    supported: true,
    timing: {
      pageLoadTime: pageLoadTime, // ms
      domReadyTime: domReadyTime, // ms
      resourceLoadTime: resourceLoadTime, // ms
    },
    resources: {
      total: resources.length,
      totalSize: totalResourceSize / 1024, // KB
      byType: resourceStats
    },
    // Only include memory info if the non-standard Chrome API is available
    memory: (() => {
      const extendedPerf = window.performance as ExtendedPerformance;
      if (extendedPerf.memory) {
        return {
          jsHeapSizeLimit: Math.round(extendedPerf.memory.jsHeapSizeLimit / (1024 * 1024)),
          totalJSHeapSize: Math.round(extendedPerf.memory.totalJSHeapSize / (1024 * 1024)),
          usedJSHeapSize: Math.round(extendedPerf.memory.usedJSHeapSize / (1024 * 1024))
        };
      }
      return 'Memory API not available';
    })()
  };
};
