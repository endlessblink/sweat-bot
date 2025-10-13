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

  constructor() {
    this.createDebugInterface();
  }

  private createDebugInterface() {
    // Only create on mobile/touch devices
    if (!('ontouchstart' in window) && !this.isAndroidChrome()) {
      console.log('[MobileDebugger] Skipping - not a mobile device');
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
  }, 2000);
}