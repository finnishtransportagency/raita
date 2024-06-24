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
    /**
     * Set if serving the application from a subpath
     */
    NEXT_PUBLIC_RAITA_BASEURL: string;
    /**
     * Change metadata database to use
     * TODO: remove later
     */
    NEXT_PUBLIC_METADATA_DATABASE: 'opensearch' | 'postgres';
    NEXT_PUBLIC_ENABLE_CSV_PAGE: string;
  }
}

declare module '*.md';
