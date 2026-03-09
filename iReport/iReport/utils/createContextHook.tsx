import { createContext, useContext, ReactNode, FC } from 'react';

/**
 * Creates a context with an associated provider component and hook
 * @param useHookValue - Function that returns the context value
 * @returns Tuple of [Provider component, useHook hook]
 */
export function createContextHook<T>(
  useHookValue: () => T
): [FC<{ children: ReactNode }>, () => T] {
  const Context = createContext<T | undefined>(undefined);

  const Provider: FC<{ children: ReactNode }> = ({ children }) => {
    const value = useHookValue();
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useHook = (): T => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('useHook must be used within the Provider');
    }
    return context;
  };

  return [Provider, useHook];
}

export default createContextHook;
