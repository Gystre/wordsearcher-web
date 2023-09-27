declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_B2_ENDPOINT: string;
      NEXT_PUBLIC_B2_BUCKET: string;
      NEXT_PUBLIC_URL: string;
      NEXT_PUBLIC_GA_TRACKING_ID: string;
      NEXT_PUBLIC_B2_KEY_ID: string;
      NEXT_PUBLIC_B2_APPLICATION_KEY: string;
      NEXT_PUBLIC_B2_BUCKET_ID: string;
      NEXT_PUBLIC_FIREBASE_API_KEY: string;
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      NEXT_PUBLIC_FIREBASE_APP_ID: string;
    }
  }
}

export {}
