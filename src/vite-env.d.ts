/// <reference types="vite/client" />

interface ImportMetaEnv {
	// undefined si la variable est absente du .env (vérifié par requireApiKey dans api/http.ts)
	readonly VITE_TMDB_API_KEY: string | undefined;
	readonly VITE_RAWG_API_KEY: string | undefined;
}
