declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_B2_ENDPOINT: string;
      NEXT_PUBLIC_B2_BUCKET: string;
      NEXT_PUBLIC_URL: string;
    }
  }
}

export {}
