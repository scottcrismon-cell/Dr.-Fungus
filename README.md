# Dr. Fungus

A polished photo-intake prototype for foot and toenail concerns. The app includes a working image picker and preview, symptom context, consent state, a Supabase-ready persistence adapter, and a clearly isolated placeholder for a future diagnostic model.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add Supabase credentials when a project is ready. Without credentials, the interface runs in safe prototype mode and does not upload selected images.

The future AI integration boundary is in `src/lib/diagnostics.ts`. Database and storage setup is in `supabase/migrations/001_create_assessments.sql`.
