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
    }
  }
}

export {}
