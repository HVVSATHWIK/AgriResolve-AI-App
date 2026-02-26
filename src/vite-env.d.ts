/// <reference types="vite/client" />

declare module '*.glsl?raw' {
    const content: string;
    export default content;
}

declare module 'virtual:pwa-register' {
    export interface RegisterSWOptions {
        immediate?: boolean;
        onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: unknown) => void;
    }

    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_API_URL: string
    readonly GEMINI_SERVICE_TOKEN: string
    readonly VITE_GEMINI_API_KEY: string // Deprecated, kept for compat if needed, but preferred below
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
