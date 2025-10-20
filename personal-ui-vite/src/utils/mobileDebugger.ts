/**
 * Mobile Debugger - User-visible debug interface for mobile devices
 *
 * This creates a debug interface that works on mobile without requiring USB debugging.
 * It shows console logs in an overlay and provides a toggle button for easy access.
 */

export class MobileDebugger {
  private logContainer: HTMLDivElement | null = null;
  private toggleBtn: HTMLButtonElement | null = null;
  private logs: string[] = [];
  private maxLogs = 50;
  private isEnabled = false;
  private backendUrl: string;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
  } | null = null;

  constructor() {
    this.backendUrl = this.getBackendUrl();
    this.createDebugInterface();
    this.interceptConsole();
  }

  private createDebugInterface() {
    // Create on mobile/touch devices or in development mode
    const isDevelopment = import.meta.env.DEV;
    if (!('ontouchstart' in window) && !this.isAndroidChrome() && !isDevelopment) {
      console.log('[MobileDebugger] Skipping - not a mobile device and not in development');
      return;
    }

    console.log('[MobileDebugger] Initializing mobile debug interface...');

    // Create toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'mobile-debug-toggle';
    this.toggleBtn.textContent = '🐛';
    this.toggleBtn.title = 'Toggle Mobile Debug Logs';
    this.toggleBtn.style.cssText = `
      position: fixed;
      top: 60px;
      left: 10px;
      width: 50px;
      height: 50px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      z-index: 99999;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    // Create log container
    this.logContainer = document.createElement('div');
    this.logContainer.id = 'mobile-debug-logger';
    this.logContainer.style.cssText = `
      position: fixed;
      top: 120px;
      left: 10px;
      width: 350px;
      max-height: 400px;
      background: rgba(0,0,0,0.95);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 5px;
      overflow-y: auto;
      z-index: 99999;
      border: 2px solid #00ff00;
      display: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    // Add clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: #444;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 2px 8px;
      font-size: 10px;
      cursor: pointer;
    `;
    clearBtn.onclick = () => this.clearLogs();

    // Add status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'debug-status';
    statusDiv.style.cssText = `
      position: absolute;
      top: 5px;
      left: 5px;
      background: #444;
      color: white;
      padding: 2px 8px;
      font-size: 10px;
      border-radius: 3px;
    `;
    statusDiv.textContent = '📱 Mobile Debug Active';

    this.logContainer.appendChild(statusDiv);
    this.logContainer.appendChild(clearBtn);

    // Toggle functionality
    this.toggleBtn.onclick = () => this.toggleLogs();

    // Add to DOM
    document.body.appendChild(this.toggleBtn);
    document.body.appendChild(this.logContainer);

    // Log initialization
    this.log('✅ Mobile Debugger initialized', {
      userAgent: navigator.userAgent.substring(0, 50),
      isMobile: this.isMobile(),
      isAndroidChrome: this.isAndroidChrome(),
      timestamp: new Date().toISOString()
    });
  }

  private toggleLogs() {
    if (!this.logContainer || !this.toggleBtn) return;

    const isVisible = this.logContainer.style.display !== 'none';
    this.logContainer.style.display = isVisible ? 'none' : 'block';
    this.toggleBtn.textContent = isVisible ? '🐛' : '❌';
    this.toggleBtn.style.background = isVisible ? '#ff4444' : '#00ff00';

    this.log(`🔍 Debug logs ${isVisible ? 'hidden' : 'visible'}`);
  }

  private clearLogs() {
    this.logs = [];
    this.updateLogDisplay();
    this.log('🗑️ Logs cleared');
  }

  private updateLogDisplay() {
    if (!this.logContainer) return;

    const logsHtml = this.logs
      .map(log => `<div style="margin-bottom: 2px; word-wrap: break-word;">${log}</div>`)
      .join('');

    // Add logs after the header elements
    const statusDiv = this.logContainer.querySelector('#debug-status');
    const clearBtn = this.logContainer.querySelector('button');

    // Clear existing logs
    const existingLogs = this.logContainer.querySelectorAll('div:not(#debug-status):not(button)');
    existingLogs.forEach(el => el.remove());

    // Add new logs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = logsHtml;
    this.logContainer.appendChild(tempDiv);

    // Auto scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  private isAndroidChrome(): boolean {
    return /Android.*Chrome/.test(navigator.userAgent);
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  log(message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString('he-IL', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let logEntry = `[${timestamp}] ${message}`;

    if (data !== undefined) {
      // Handle different data types
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          logEntry += ` ❌ ${data.message}`;
          console.error(logEntry, data);
        } else {
          logEntry += ` ${JSON.stringify(data, null, 2)}`;
          console.log(logEntry, data);
        }
      } else {
        logEntry += ` ${data}`;
        console.log(logEntry, data);
      }
    } else {
      console.log(logEntry);
    }

    // Add to mobile debug interface
    if (this.logContainer) {
      this.logs.push(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift(); // Keep only recent logs
      }

      this.updateLogDisplay();
    }
  }

  error(message: string, error?: any) {
    this.log(`❌ ERROR: ${message}`, error);
  }

  success(message: string, data?: any) {
    this.log(`✅ SUCCESS: ${message}`, data);
  }

  warn(message: string, data?: any) {
    this.log(`⚠️ WARNING: ${message}`, data);
  }

  info(message: string, data?: any) {
    this.log(`ℹ️ INFO: ${message}`, data);
  }

  // Method to test if debugger is working
  test() {
    this.log('🧪 Mobile Debugger Test', { timestamp: Date.now() });
    this.success('Test successful', { test: true });
    this.warn('Test warning', { warning: 'This is a test' });
    this.error('Test error', { error: 'This is a test error' });
  }

  // Get debug info as text for easy copying
  getDebugInfo(): string {
    return {
      logs: this.logs,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      mobile: this.isMobile(),
      androidChrome: this.isAndroidChrome()
    } as any;
  }

  // Enable/disable debugger
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (this.toggleBtn && this.logContainer) {
      this.toggleBtn.style.display = enabled ? 'block' : 'none';
      this.logContainer.style.display = 'none';
    }
  }

  private getBackendUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.host}`;
      }
    }
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  private interceptConsole(): void {
    // Store original console methods at class level
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    // Override console methods to send logs to backend
    const originalLog = this.originalConsole.log.bind(this.originalConsole);
    const originalWarn = this.originalConsole.warn.bind(this.originalConsole);
    const originalError = this.originalConsole.error.bind(this.originalConsole);
    const originalInfo = this.originalConsole.info.bind(this.originalConsole);

    console.log = (...args: any[]) => {
      originalLog(...args);
      this.sendToBackend('info', args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      this.sendToBackend('warn', args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      this.sendToBackend('error', args);
    };

    console.info = (...args: any[]) => {
      originalInfo(...args);
      this.sendToBackend('info', args);
    };

    this.log('📡 Console interception enabled');
  }

  private async sendToBackend(level: string, args: any[]): Promise<void> {
    try {
      // Format the message
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return '[Object]';
          }
        }
        return String(arg);
      }).join(' ');

      // Extract structured data from voice transcription patterns
      let data: any = null;
      if (message.includes('blob size:') || message.includes('Response received') || message.includes('Transcription') || message.includes('[BackendSTT]')) {
        const blobSizeMatch = message.match(/blob size: (\d+) bytes/);
        const responseTimeMatch = message.match(/Response received in (\d+)ms/);
        const statusMatch = message.match(/status: (\d+)/);

        if (blobSizeMatch || responseTimeMatch || statusMatch) {
          data = {
            blobSize: blobSizeMatch ? parseInt(blobSizeMatch[1]) : undefined,
            responseTime: responseTimeMatch ? parseInt(responseTimeMatch[1]) : undefined,
            status: statusMatch ? parseInt(statusMatch[1]) : undefined,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Send to backend (non-blocking)
      fetch(`${this.backendUrl}/api/v1/stt/debug-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          data,
          source: 'mobile-debugger',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => {
        // Silently fail to avoid infinite loops
        if (this.originalConsole && this.originalConsole.warn) {
          this.originalConsole.warn('[MobileDebugger] Failed to send log:', err);
        } else {
          // Use native console methods directly to avoid circular calls
          const nativeConsole = window.console || { warn: () => {} };
          nativeConsole.warn('[MobileDebugger] Failed to send log:', err);
        }
      });

    } catch (error) {
      // Don't let logging errors break the app
      console.warn('[MobileDebugger] Send error:', error);
    }
  }

  // Method to test connection to backend
  async testBackendConnection(): Promise<boolean> {
    try {
      // Test the health endpoint instead (more reliable)
      const response = await fetch(`${this.backendUrl}/health`);
      const result = await response.json();
      this.log('🔗 Backend connection test successful', result);
      return true;
    } catch (error) {
      this.error('Backend connection test failed', error);
      return false;
    }
  }
}

// Create global instance for easy import
export const mobileDebug = new MobileDebugger();

// Auto-test after page load to verify it's working
if (typeof window !== 'undefined') {
  setTimeout(() => {
    mobileDebug.log('🚀 Page load complete - Mobile Debug ready');
    mobileDebug.log('📱 Device info:', {
      userAgent: navigator.userAgent.substring(0, 80),
      mobile: /Mobile|Android|iPhone/.test(navigator.userAgent),
      touch: 'ontouchstart' in window,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    });

    // Test backend connection
    mobileDebug.testBackendConnection();
  }, 2000);
}