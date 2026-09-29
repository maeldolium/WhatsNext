// Réponses brutes de TMDB, avant conversion par utils/normalize.ts.
// Les noms des champs doivent être exactement ceux de l'API.

export interface TmdbMovieRaw {
	id: number;
	title: string;
	/** Chemin relatif (ex. "/abc.jpg") à préfixer par l'URL des images TMDB */
	poster_path: string | null;
	/** Format "YYYY-MM-DD", chaîne vide si la date est inconnue */
	release_date: string;
	/** IDs de genres TMDB, traduits en noms par normalize.ts (table fixe TMDB_GENRES) */
	genre_ids: number[];
	overview: string;
	popularity: number;
	/** Note moyenne des spectateurs, sur 10 */
	vote_average: number;
	vote_count: number;
}

// Mêmes champs que pour un film, mais le titre et la date n'ont pas le même nom
export interface TmdbTvShowRaw {
	id: number;
	name: string;
	poster_path: string | null;
	/** Date du premier épisode, format "YYYY-MM-DD", chaîne vide si inconnue */
	first_air_date: string;
	/** IDs de genres des séries, en partie différents de ceux des films (table TMDB_TV_GENRES) */
	genre_ids: number[];
	overview: string;
	popularity: number;
	vote_average: number;
	vote_count: number;
}

export interface TmdbListResponse<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
}
