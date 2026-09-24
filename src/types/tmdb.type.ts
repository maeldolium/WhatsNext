/**
 * Film tel que renvoyé par l'API TMDB (endpoints de recherche / listes),
 * avant toute transformation vers le modèle de l'app.
 */
export interface TmdbMovieRaw {
	id: number;
	title: string;
	/** Chemin relatif (ex. "/abc.jpg") à préfixer par l'URL d'images TMDB, ex. https://image.tmdb.org/t/p/w500 */
	poster_path: string | null;
	/** Format "YYYY-MM-DD", peut être une chaîne vide si inconnue */
	release_date: string;
	/** IDs de genres TMDB, à résoudre via l'endpoint /genre/movie/list */
	genre_ids: number[];
	overview: string;
	popularity: number;
}

/** Réponse paginée des endpoints de recherche TMDB (ex. /search/movie) */
export interface TmdbSearchResponse {
	page: number;
	results: TmdbMovieRaw[];
	total_pages: number;
	total_results: number;
}
