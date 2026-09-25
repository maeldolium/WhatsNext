/**
 * Jeu tel que renvoyé par l'API RAWG dans les listes / recherches (/games),
 * avant toute transformation vers le modèle de l'app.
 */
export interface RawgGameRaw {
	id: number;
	name: string;
	/** URL complète de l'image (pas de préfixe à ajouter, contrairement à TMDB) */
	background_image: string | null;
	/** Format "YYYY-MM-DD", null si la date de sortie est inconnue */
	released: string | null;
	/** Note moyenne des joueurs, sur 5 (ex. 4.38) */
	rating: number;
	/** Note de la presse (Metacritic), sur 100. null si le jeu n'a pas été noté */
	metacritic: number | null;
	genres: RawgGenre[];
}

export interface RawgGenre {
	id: number;
	name: string;
	slug: string;
}

/**
 * Détail d'un jeu (/games/{id}) : la description n'est disponible
 * que sur cet endpoint, pas dans les listes.
 */
export interface RawgGameDetailRaw extends RawgGameRaw {
	/** Description en HTML */
	description: string;
	/** Même description en texte brut, plus simple à afficher */
	description_raw: string;
}

/** Réponse paginée des endpoints de liste / recherche RAWG */
export interface RawgResponse {
	/** Nombre total de résultats, toutes pages confondues */
	count: number;
	/** URL de la page suivante, null sur la dernière page */
	next: string | null;
	/** URL de la page précédente, null sur la première page */
	previous: string | null;
	results: RawgGameRaw[];
}
