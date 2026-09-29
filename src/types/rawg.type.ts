// Réponses brutes de RAWG, avant conversion par utils/normalize.ts.
// Les noms des champs doivent être exactement ceux de l'API.

export interface RawgGameRaw {
	id: number;
	name: string;
	/** URL complète (pas de préfixe à ajouter, contrairement à TMDB) */
	background_image: string | null;
	/** Format "YYYY-MM-DD", null si la date est inconnue */
	released: string | null;
	/** Note moyenne des joueurs, sur 5 */
	rating: number;
	/** Note de la presse, sur 100. null si le jeu n'a pas été noté */
	metacritic: number | null;
	genres: RawgGenre[];
}

export interface RawgGenre {
	id: number;
	name: string;
	/** Identifiant texte (ex. "role-playing-games-rpg"), utilisé pour traduire le genre */
	slug: string;
}

export interface RawgResponse {
	count: number;
	/** URL de la page suivante, null sur la dernière page */
	next: string | null;
	previous: string | null;
	results: RawgGameRaw[];
}
