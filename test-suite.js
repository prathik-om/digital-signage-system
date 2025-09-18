const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  proxyBaseUrl: 'http://localhost:3001/api',
  remoteBaseUrl: 'https://atrium-60045083855.development.catalystserverless.in',
  timeout: 10000,
  retries: 3
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  details: {}
};

// Utility functions
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const color = type === 'ERROR' ? '\x1b[31m' : type === 'WARNING' ? '\x1b[33m' : type === 'SUCCESS' ? '\x1b[32m' : '\x1b[0m';
  console.log(`${color}[${timestamp}] ${type}: ${message}\x1b[0m`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test runner
class APITester {
  constructor() {
    this.endpoints = [
      { name: 'auth', path: '/auth', actions: ['login', 'logout', 'checkAuth'] },
      { name: 'content', path: '/content', actions: ['getAll', 'create', 'update', 'delete'] },
      { name: 'playlist', path: '/playlist', actions: ['getAll', 'create', 'update', 'delete', 'addContent', 'checkSchema'] },
      { name: 'emergency', path: '/emergency', actions: ['getAll', 'create', 'update', 'delete'] },
      { name: 'zoho-integration', path: '/zoho-integration', actions: ['fetchMessages', 'sendMessage'] },
      { name: 'media-upload', path: '/media-upload', actions: ['listMedia', 'uploadBase64', 'deleteMedia'] },
      { name: 'settings', path: '/settings', actions: ['getAll', 'update'] }
    ];
  }

  async testEndpoint(endpoint) {
    log(`Testing endpoint: ${endpoint.name}`, 'INFO');
    const results = { endpoint: endpoint.name, tests: [] };

    for (const action of endpoint.actions) {
      try {
        const testResult = await this.testAction(endpoint.path, action);
        results.tests.push(testResult);
        
        if (testResult.status === 'PASS') {
          testResults.passed++;
        } else {
          testResults.failed++;
          if (testResult.status === 'ERROR') {
            testResults.errors.push(`${endpoint.name}.${action}: ${testResult.message}`);
          } else if (testResult.status === 'WARNING') {
            testResults.warnings.push(`${endpoint.name}.${action}: ${testResult.message}`);
          }
        }
      } catch (error) {
        const testResult = {
          action,
          status: 'ERROR',
          message: error.message,
          details: { error: error.toString() }
        };
        results.tests.push(testResult);
        testResults.failed++;
        testResults.errors.push(`${endpoint.name}.${action}: ${error.message}`);
      }
    }

    testResults.details[endpoint.name] = results;
    return results;
  }

  async testAction(path, action) {
    const testData = this.generateTestData(action);
    const url = `${TEST_CONFIG.proxyBaseUrl}${path}`;
    
    log(`  Testing action: ${action}`, 'INFO');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        timeout: TEST_CONFIG.timeout
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        return {
          action,
          status: 'ERROR',
          message: 'Invalid JSON response',
          details: {
            status: response.status,
            responseText,
            expectedFormat: 'Valid JSON'
          }
        };
      }

      // Validate response structure
      const validation = this.validateResponse(action, responseData);
      
      if (validation.isValid) {
        return {
          action,
          status: 'PASS',
          message: 'Action completed successfully',
          details: {
            status: response.status,
            response: responseData
          }
        };
      } else {
        return {
          action,
          status: 'WARNING',
          message: 'Response structure issues detected',
          details: {
            status: response.status,
            response: responseData,
            issues: validation.issues
          }
        };
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          action,
          status: 'ERROR',
          message: 'Connection refused - proxy server not running',
          details: { error: error.message }
        };
      }
      
      return {
        action,
        status: 'ERROR',
        message: `Request failed: ${error.message}`,
        details: { error: error.toString() }
      };
    }
  }

  generateTestData(action) {
    const baseData = { action };
    
    switch (action) {
      case 'create':
        return {
          ...baseData,
          name: 'Test Item',
          description: 'Test description'
        };
      
      case 'update':
        return {
          ...baseData,
          id: 1,
          name: 'Updated Item',
          description: 'Updated description'
        };
      
      case 'addContent':
        return {
          ...baseData,
          playlist_id: 1,
          content_id: 1
        };
      
      case 'uploadBase64':
        return {
          ...baseData,
          data_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          file_name: 'test.png',
          folder_id: 'test'
        };
      
      default:
        return baseData;
    }
  }

  validateResponse(action, response) {
    const issues = [];
    
    // Check basic structure
    if (typeof response !== 'object' || response === null) {
      issues.push('Response is not an object');
      return { isValid: false, issues };
    }

    // Check for success property
    if (response.success === undefined) {
      issues.push('Missing success property');
    }

    // Check for message property
    if (response.message === undefined) {
      issues.push('Missing message property');
    }

    // Action-specific validation
    switch (action) {
      case 'getAll':
        if (response.success && !response.hasOwnProperty('playlists') && !response.hasOwnProperty('content') && !response.hasOwnProperty('settings')) {
          issues.push('getAll response missing data array (playlists/content/settings)');
        }
        break;
      
      case 'create':
        if (response.success && !response.hasOwnProperty('playlistId') && !response.hasOwnProperty('id')) {
          issues.push('create response missing ID field');
        }
        break;
      
      case 'checkSchema':
        if (response.success && !response.hasOwnProperty('available_columns')) {
          issues.push('checkSchema response missing available_columns');
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  async runAllTests() {
    log('🚀 Starting comprehensive API test suite...', 'INFO');
    log(`📡 Testing ${this.endpoints.length} endpoints through proxy: ${TEST_CONFIG.proxyBaseUrl}`, 'INFO');
    
    const startTime = Date.now();
    
    for (const endpoint of this.endpoints) {
      await this.testEndpoint(endpoint);
      await sleep(100); // Small delay between endpoints
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    this.generateReport(duration);
  }

  generateReport(duration) {
    log('\n' + '='.repeat(80), 'INFO');
    log('📊 COMPREHENSIVE TEST REPORT', 'INFO');
    log('='.repeat(80), 'INFO');
    
    log(`⏱️  Total test duration: ${duration.toFixed(2)} seconds`, 'INFO');
    log(`✅ Tests passed: ${testResults.passed}`, 'SUCCESS');
    log(`❌ Tests failed: ${testResults.failed}`, testResults.failed > 0 ? 'ERROR' : 'SUCCESS');
    log(`⚠️  Warnings: ${testResults.warnings.length}`, testResults.warnings.length > 0 ? 'WARNING' : 'INFO');
    
    if (testResults.errors.length > 0) {
      log('\n🚨 ERRORS FOUND:', 'ERROR');
      testResults.errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error}`, 'ERROR');
      });
    }
    
    if (testResults.warnings.length > 0) {
      log('\n⚠️  WARNINGS:', 'WARNING');
      testResults.warnings.forEach((warning, index) => {
        log(`  ${index + 1}. ${warning}`, 'WARNING');
      });
    }
    
    log('\n📋 DETAILED RESULTS:', 'INFO');
    Object.entries(testResults.details).forEach(([endpoint, result]) => {
      const passed = result.tests.filter(t => t.status === 'PASS').length;
      const total = result.tests.length;
      const status = passed === total ? '✅' : passed > 0 ? '⚠️' : '❌';
      
      log(`${status} ${endpoint}: ${passed}/${total} tests passed`, passed === total ? 'SUCCESS' : passed > 0 ? 'WARNING' : 'ERROR');
      
      result.tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌';
        log(`    ${icon} ${test.action}: ${test.message}`, test.status === 'PASS' ? 'SUCCESS' : test.status === 'WARNING' ? 'WARNING' : 'ERROR');
      });
    });
    
    log('\n' + '='.repeat(80), 'INFO');
    
    if (testResults.failed === 0) {
      log('🎉 All tests passed! Your API is working correctly.', 'SUCCESS');
    } else {
      log('🔧 Some tests failed. Review the errors above and fix the issues.', 'ERROR');
    }
    
    log('='.repeat(80), 'INFO');
  }
}

// Run the test suite
async function main() {
  try {
    const tester = new APITester();
    await tester.runAllTests();
  } catch (error) {
    log(`Test suite failed to run: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Check if proxy is running before starting tests
async function checkProxy() {
  try {
    const response = await fetch(`${TEST_CONFIG.proxyBaseUrl}/playlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getAll' }),
      timeout: 5000
    });
    
    if (response.ok) {
      log('✅ Proxy server is running and responding', 'SUCCESS');
      return true;
    } else {
      log('❌ Proxy server responded with error status', 'ERROR');
      return false;
    }
  } catch (error) {
    log('❌ Proxy server is not running or not accessible', 'ERROR');
    log('💡 Please start the proxy server with: node local-test-proxy.js', 'INFO');
    return false;
  }
}

// Main execution
if (require.main === module) {
  checkProxy().then(isRunning => {
    if (isRunning) {
      main();
    } else {
      process.exit(1);
    }
  });
}

module.exports = { APITester, testResults };
