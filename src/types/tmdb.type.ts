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
	/** Note moyenne des spectateurs TMDB, sur 10 */
	vote_average: number;
	/** Nombre de votes, utile pour écarter les notes peu fiables */
	vote_count: number;
}

/**
 * Série telle que renvoyée par l'API TMDB (/search/tv). Mêmes champs que
 * pour un film, sauf le titre et la date qui portent un autre nom.
 */
export interface TmdbTvShowRaw {
	id: number;
	/** Équivalent de "title" pour un film */
	name: string;
	/** Chemin relatif, à préfixer comme pour les films */
	poster_path: string | null;
	/** Date du premier épisode, format "YYYY-MM-DD", peut être une chaîne vide */
	first_air_date: string;
	/** IDs de genres TMDB des séries (différents en partie de ceux des films) */
	genre_ids: number[];
	overview: string;
	popularity: number;
	/** Note moyenne des spectateurs TMDB, sur 10 */
	vote_average: number;
	/** Nombre de votes, utile pour écarter les notes peu fiables */
	vote_count: number;
}

/**
 * Réponse paginée des endpoints de liste TMDB (/search, /discover). T est le type
 * d'un résultat : TmdbMovieRaw pour les films, TmdbTvShowRaw pour les séries.
 */
export interface TmdbSearchResponse<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
}
