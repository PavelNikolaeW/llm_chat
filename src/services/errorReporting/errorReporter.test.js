import {
  init,
  shutdown,
  captureError,
  captureMessage,
  captureReactError,
  addBreadcrumb,
  clearBreadcrumbs,
  getBreadcrumbs,
  getConfig,
  isInitialized,
  ErrorSeverity,
} from './errorReporter';

describe('errorReporter', () => {
  beforeEach(() => {
    shutdown();
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  afterEach(() => {
    shutdown();
  });

  describe('init', () => {
    it('initializes the error reporter', () => {
      init({ environment: 'test' });
      expect(isInitialized()).toBe(true);
    });

    it('applies configuration options', () => {
      init({
        endpoint: 'https://errors.example.com',
        environment: 'production',
        appVersion: '2.0.0',
      });
      const config = getConfig();
      expect(config.endpoint).toBe('https://errors.example.com');
      expect(config.environment).toBe('production');
      expect(config.appVersion).toBe('2.0.0');
    });

    it('sets up global error handlers', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      init();
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });
  });

  describe('shutdown', () => {
    it('sets initialized to false', () => {
      init();
      expect(isInitialized()).toBe(true);
      shutdown();
      expect(isInitialized()).toBe(false);
    });

    it('removes global error handlers', () => {
      init();
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      shutdown();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('clears breadcrumbs', () => {
      init();
      addBreadcrumb({ message: 'test' });
      expect(getBreadcrumbs()).toHaveLength(1);
      shutdown();
      init();
      expect(getBreadcrumbs()).toHaveLength(0);
    });
  });

  describe('addBreadcrumb', () => {
    beforeEach(() => {
      init();
    });

    it('adds breadcrumb with defaults', () => {
      addBreadcrumb({ message: 'Test breadcrumb' });
      const crumbs = getBreadcrumbs();
      expect(crumbs).toHaveLength(1);
      expect(crumbs[0].message).toBe('Test breadcrumb');
      expect(crumbs[0].category).toBe('default');
      expect(crumbs[0].level).toBe('info');
    });

    it('adds breadcrumb with custom fields', () => {
      addBreadcrumb({
        message: 'Click event',
        category: 'ui',
        level: 'info',
        data: { button: 'submit' },
      });
      const crumbs = getBreadcrumbs();
      expect(crumbs[0].category).toBe('ui');
      expect(crumbs[0].data.button).toBe('submit');
    });

    it('respects max breadcrumbs limit', () => {
      init({ maxBreadcrumbs: 3 });
      addBreadcrumb({ message: 'First' });
      addBreadcrumb({ message: 'Second' });
      addBreadcrumb({ message: 'Third' });
      addBreadcrumb({ message: 'Fourth' });
      const crumbs = getBreadcrumbs();
      expect(crumbs).toHaveLength(3);
      expect(crumbs[0].message).toBe('Second');
    });

    it('sanitizes breadcrumb data', () => {
      addBreadcrumb({
        message: 'User action',
        data: { password: 'secret123' },
      });
      const crumbs = getBreadcrumbs();
      expect(crumbs[0].data.password).toBe('[REDACTED]');
    });

    it('does nothing if not initialized', () => {
      shutdown();
      addBreadcrumb({ message: 'Test' });
      init();
      expect(getBreadcrumbs()).toHaveLength(0);
    });
  });

  describe('clearBreadcrumbs', () => {
    it('clears all breadcrumbs', () => {
      init();
      addBreadcrumb({ message: 'First' });
      addBreadcrumb({ message: 'Second' });
      expect(getBreadcrumbs()).toHaveLength(2);
      clearBreadcrumbs();
      expect(getBreadcrumbs()).toHaveLength(0);
    });
  });

  describe('captureError', () => {
    beforeEach(() => {
      init({ enabled: true });
    });

    it('does nothing if not initialized', () => {
      shutdown();
      captureError(new Error('Test'));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does nothing if disabled', () => {
      init({ enabled: false });
      captureError(new Error('Test'));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('respects sample rate', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      init({ sampleRate: 0.1 });
      captureError(new Error('Test'));
      expect(global.fetch).not.toHaveBeenCalled();
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('sends error to endpoint', async () => {
      init({ endpoint: 'https://errors.example.com' });
      captureError(new Error('Test error'));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(global.fetch).toHaveBeenCalledWith(
        'https://errors.example.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('logs to console when no endpoint', () => {
      const consoleGroup = jest.spyOn(console, 'group').mockImplementation();
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEnd = jest.spyOn(console, 'groupEnd').mockImplementation();

      init({ environment: 'development' });
      captureError(new Error('Test'));

      // Wait for async operation
      return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
        expect(consoleGroup).toHaveBeenCalled();
        consoleGroup.mockRestore();
        consoleLog.mockRestore();
        consoleGroupEnd.mockRestore();
      });
    });

    it('includes breadcrumbs in payload', async () => {
      init({ endpoint: 'https://errors.example.com' });
      addBreadcrumb({ message: 'User clicked button' });
      captureError(new Error('Test'));

      await new Promise(resolve => setTimeout(resolve, 0));

      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      expect(payload.breadcrumbs).toHaveLength(1);
    });

    it('sanitizes error message', async () => {
      init({ endpoint: 'https://errors.example.com' });
      captureError(new Error('Token expired: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc'));

      await new Promise(resolve => setTimeout(resolve, 0));

      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      expect(payload.error.message).toContain('[REDACTED]');
    });

    it('calls beforeSend hook', async () => {
      const beforeSend = jest.fn(data => data);
      init({ endpoint: 'https://errors.example.com', beforeSend });
      captureError(new Error('Test'));

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(beforeSend).toHaveBeenCalled();
    });

    it('drops event if beforeSend returns null', () => {
      const beforeSend = jest.fn(() => null);
      init({ endpoint: 'https://errors.example.com', beforeSend });
      captureError(new Error('Test'));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('calls onError callback on send failure', async () => {
      const onError = jest.fn();
      global.fetch.mockRejectedValue(new Error('Network error'));

      init({ endpoint: 'https://errors.example.com', onError });
      captureError(new Error('Test'));

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('captureMessage', () => {
    beforeEach(() => {
      init({ enabled: true });
    });

    it('captures info messages', async () => {
      init({ endpoint: 'https://errors.example.com' });
      captureMessage('User logged in');

      await new Promise(resolve => setTimeout(resolve, 0));

      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      expect(payload.type).toBe('message');
      expect(payload.severity).toBe(ErrorSeverity.INFO);
    });

    it('respects custom severity', async () => {
      init({ endpoint: 'https://errors.example.com' });
      captureMessage('Warning message', {}, ErrorSeverity.WARNING);

      await new Promise(resolve => setTimeout(resolve, 0));

      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      expect(payload.severity).toBe(ErrorSeverity.WARNING);
    });

    it('sanitizes message content', async () => {
      init({ endpoint: 'https://errors.example.com' });
      captureMessage('User email: test@example.com');

      await new Promise(resolve => setTimeout(resolve, 0));

      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      expect(payload.message).toContain('[REDACTED]');
    });
  });

  describe('captureReactError', () => {
    it('captures React errors with component stack', async () => {
      init({ endpoint: 'https://errors.example.com' });
      const error = new Error('React error');
      const errorInfo = { componentStack: '\n    at Button\n    at App' };

      captureReactError(error, errorInfo);

      await new Promise(resolve => setTimeout(resolve, 0));

      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      expect(payload.context.source).toBe('ErrorBoundary');
      expect(payload.context.componentStack).toBeDefined();
    });
  });

  describe('ErrorSeverity', () => {
    it('exports severity levels', () => {
      expect(ErrorSeverity.DEBUG).toBe('debug');
      expect(ErrorSeverity.INFO).toBe('info');
      expect(ErrorSeverity.WARNING).toBe('warning');
      expect(ErrorSeverity.ERROR).toBe('error');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });
});
