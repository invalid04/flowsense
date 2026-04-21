export {};

declare global {
  interface Window {
    FlowSense?: {
      init: (config: {
        apiKey?: string;
        endpoint?: string;
        debug?: boolean;
      }) => void;

      track: (state: string) => Promise<{ message?: string }>;

      trackTransition?: (
        fromState: string,
        toState: string
      ) => Promise<{ message?: string }>;

      destroy?: () => void;
    };
  }
}
