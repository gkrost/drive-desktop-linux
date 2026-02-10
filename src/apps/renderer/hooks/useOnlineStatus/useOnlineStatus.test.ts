import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOnlineStatus } from './useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should return true when online', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);

    const { result } = renderHook(() => useOnlineStatus(1000));

    // Flush the initial useEffect promise (advanceTimersByTimeAsync also drains microtasks)
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(result.current).toBe(true);
  });

  it('should return false when offline', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(false);

    const { result } = renderHook(() => useOnlineStatus(1000));

    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(result.current).toBe(false);
  });

  it('should return true when online after being offline', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(false);

    const { rerender, result } = renderHook(() => useOnlineStatus(1000));

    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current).toBe(false);

    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);
    rerender();

    // Advance past the interval so the new mock value is picked up
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(result.current).toBe(true);
  });

  it('should use navigator.onLine as fallback if checkInternetConnection fails', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockRejectedValue(new Error('IPC failed'));

    // Mock navigator.onLine to return false
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus(1000));

    // Flush the initial useEffect rejected promise + fallback
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(result.current).toBe(false);
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerMock = vi.spyOn(window, 'addEventListener');
    const removeEventListenerMock = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus(1000));

    expect(addEventListenerMock).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerMock).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should respect the custom interval time', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);

    const INTERVAL = 5000;
    renderHook(() => useOnlineStatus(INTERVAL));

    // Flush the initial call from useEffect
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(window.electron.checkInternetConnection).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(window.electron.checkInternetConnection).toHaveBeenCalledTimes(2);
  });

  it('should update state only when checkInternetConnection returns a different value', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);

    const { result } = renderHook(() => useOnlineStatus(1000));

    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(window.electron.checkInternetConnection).toHaveBeenCalledTimes(4);
    expect(result.current).toBe(true);
  });
});
