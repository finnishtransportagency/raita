declare namespace NodeJS {
  export interface ProcessEnv {
    /**
     * REST API base URL
     */
    NEXT_PUBLIC_API_BASEURL: string;

    /**
     * @deprecated
     */
    API_BASEURL: string;
  }
}
