import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  testProfileUpdate, 
  testViewportSize,
  testNavigationLayout,
  testPerformance
} from '../utils/testHelpers';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  ScreenShare, 
  User, 
  Menu, 
  Info, 
  Gauge,
  TestTube 
} from 'lucide-react';

const TestPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [viewportInfo, setViewportInfo] = useState(testViewportSize());
  const [navInfo, setNavInfo] = useState(testNavigationLayout(user, updateUser));
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    profileTest: false,
    navTest: false,
    viewportTest: false,
    perfTest: false
  });

  // Function to run the profile update test
  const runProfileTest = async () => {
    setIsLoading(prev => ({ ...prev, profileTest: true }));
    try {
      const result = await testProfileUpdate(updateUser, user);
      setTestResults(prev => ({ 
        ...prev, 
        profileUpdate: result 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, profileTest: false }));
    }
  };

  // Function to run viewport size test
  const runViewportTest = () => {
    setIsLoading(prev => ({ ...prev, viewportTest: true }));
    try {
      const result = testViewportSize();
      setViewportInfo(result);
      setTestResults(prev => ({ 
        ...prev, 
        viewport: {
          success: true,
          message: `Viewport size: ${result.width}x${result.height} (${result.isMobile ? 'Mobile' : 'Desktop'})`
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, viewportTest: false }));
    }
  };

  // Function to test navigation layout switching
  const runNavigationTest = async () => {
    setIsLoading(prev => ({ ...prev, navTest: true }));
    try {
      const layoutInfo = testNavigationLayout(user, updateUser);
      if (layoutInfo && layoutInfo.switchLayout) {
        const result = await layoutInfo.switchLayout();
        setNavInfo(testNavigationLayout(user, updateUser));
        setTestResults(prev => ({ 
          ...prev, 
          navigation: result
        }));
      }
    } finally {
      setIsLoading(prev => ({ ...prev, navTest: false }));
    }
  };
  
  // Function to run performance tests
  const runPerformanceTest = () => {
    setIsLoading(prev => ({ ...prev, perfTest: true }));
    try {
      const result = testPerformance();
      setPerformanceData(result);
      setTestResults(prev => ({ 
        ...prev, 
        performance: {
          success: result.supported,
          message: result.supported 
            ? `Page load time: ${result.timing?.pageLoadTime || 'N/A'}ms, Resources: ${result.resources?.total || 'N/A'}`
            : result.message
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, perfTest: false }));
    }
  };

  // Effect to update viewport on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setViewportInfo(testViewportSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Suite</h1>
      <p className="mb-6 text-muted-foreground">
        Use these tools to test various aspects of the application functionality.
      </p>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Update
          </TabsTrigger>
          <TabsTrigger value="responsive" className="flex items-center gap-2">
            <ScreenShare className="h-4 w-4" />
            Responsive Design
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Navigation Layout
          </TabsTrigger>
        </TabsList>

        {/* Profile Update Test Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Name Update Test</CardTitle>
              <CardDescription>
                Test if your name is properly saved to the database when updated on the profile page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                <strong>Current user:</strong> {user ? `${user.firstName} ${user.lastName} (@${user.username})` : 'Not logged in'}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This test will add a timestamp to your current name and attempt to save it to the database.
              </p>

              {testResults.profileUpdate && (
                <div className={`p-4 mb-4 rounded-md ${testResults.profileUpdate.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900'}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {testResults.profileUpdate.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${testResults.profileUpdate.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                        {testResults.profileUpdate.success ? 'Test Passed' : 'Test Failed'}
                      </h3>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <p>{testResults.profileUpdate.message}</p>
                        {testResults.profileUpdate.originalValue && (
                          <p className="mt-1">
                            <strong>Original value:</strong> {testResults.profileUpdate.originalValue}
                          </p>
                        )}
                        {testResults.profileUpdate.newValue && (
                          <p className="mt-1">
                            <strong>Updated value:</strong> {testResults.profileUpdate.newValue}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runProfileTest} disabled={isLoading.profileTest}>
                {isLoading.profileTest ? 'Testing...' : 'Run Test'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Responsive Design Test Tab */}
        <TabsContent value="responsive">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Design Test</CardTitle>
              <CardDescription>
                Check the current viewport size and browser dimensions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Viewport Width</p>
                    <p className="text-2xl font-bold">{viewportInfo.width}px</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Viewport Height</p>
                    <p className="text-2xl font-bold">{viewportInfo.height}px</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  <p className="text-sm font-medium mb-2">Device Type</p>
                  <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewportInfo.isMobile ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                  }`}>
                    {viewportInfo.isMobile ? 'Mobile' : 'Desktop'}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  <p className="text-sm font-medium mb-2">Tailwind Breakpoints</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(viewportInfo.breakpoints).map(([breakpoint, active]) => (
                      <span key={breakpoint} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        active ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {breakpoint} {active ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium mb-2">Testing Instructions</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    To test responsiveness:
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>Resize your browser window to see how the layout adapts</li>
                    <li>Open browser dev tools and use the device simulator</li>
                    <li>Test on actual mobile devices if possible</li>
                  </ol>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={runViewportTest} disabled={isLoading.viewportTest}>
                {isLoading.viewportTest ? 'Checking...' : 'Refresh Viewport Info'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Navigation Layout Test Tab */}
        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Layout Test</CardTitle>
              <CardDescription>
                Switch between the sidebar and header navigation layouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md mb-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Menu className={`h-8 w-8 ${navInfo.currentLayout === 'sidebar' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </div>
                  <p className={`text-sm font-medium ${navInfo.currentLayout === 'sidebar' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    Sidebar Layout
                  </p>
                </div>
                <div className="text-2xl dark:text-gray-400">→</div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Menu className={`h-8 w-8 rotate-90 ${navInfo.currentLayout === 'header' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </div>
                  <p className={`text-sm font-medium ${navInfo.currentLayout === 'header' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    Header Layout
                  </p>
                </div>
              </div>
              
              <p className="mb-6">
                <strong>Current Layout:</strong> {navInfo.currentLayout}
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-yellow-400 dark:text-yellow-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Switching layouts will save your preference to your user profile. The page will reload to apply the changes.
                    </p>
                  </div>
                </div>
              </div>

              {testResults.navigation && (
                <div className={`p-4 mb-4 rounded-md ${testResults.navigation.success ? 'bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900'}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {testResults.navigation.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${testResults.navigation.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                        {testResults.navigation.success ? 'Layout Changed' : 'Layout Change Failed'}
                      </h3>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <p>{testResults.navigation.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={runNavigationTest} disabled={isLoading.navTest}>
                {isLoading.navTest ? 'Switching...' : `Switch to ${navInfo.currentLayout === 'sidebar' ? 'Header' : 'Sidebar'} Layout`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestPage;
