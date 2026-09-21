/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Document {
  readonly modelContext?: {
    registerTool: (
      tool: {
        name: string;
        title?: string;
        description: string;
        inputSchema: object;
        annotations?: {
          readOnlyHint?: boolean;
          untrustedContentHint?: boolean;
        };
        execute: (input: unknown) => unknown | Promise<unknown>;
      },
      options?: { signal?: AbortSignal },
    ) => void | Promise<void>;
  };
}
