export type SequenceConfig = {
    apiUrl: string;
    apiKey: string;
    debug?: boolean;
  };
  
  export type TrackTransitionInput = {
    fromState: string;
    toState: string;
    sessionKey?: string;
  };