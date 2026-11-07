/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SITE_NAME?: string;
  readonly VITE_ALLOW_DIRECT_API?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
