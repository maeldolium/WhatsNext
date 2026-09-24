import type { RawgGameRaw } from "../types/rawg.type.ts";
import type { NewWatchlistItem } from "../types/store.ts";
import type { TmdbMovieRaw } from "../types/tmdb.type.ts";

// Les normaliseurs renvoient un NewWatchlistItem : id, dates, statut, note,
// favori et notes sont remplis par store.addItem() avec ses valeurs par défaut.

// TMDB ne renvoie qu'un chemin partiel ("/abc.jpg"). w500 = largeur 500px.
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Correspondance ID → nom des genres de films TMDB (en français).
// Ces IDs sont fixes côté TMDB : on évite ainsi un appel à /genre/movie/list.
const TMDB_GENRES: Record<number, string> = {
	28: "Action",
	12: "Aventure",
	16: "Animation",
	35: "Comédie",
	80: "Crime",
	99: "Documentaire",
	18: "Drame",
	10751: "Familial",
	14: "Fantastique",
	36: "Histoire",
	27: "Horreur",
	10402: "Musique",
	9648: "Mystère",
	10749: "Romance",
	878: "Science-Fiction",
	10770: "Téléfilm",
	53: "Thriller",
	10752: "Guerre",
	37: "Western",
};

// Traduction des genres RAWG, qui ne sont disponibles qu'en anglais.
// La clé est le slug (identifiant technique, ex. "role-playing-games-rpg"),
// plus stable que le nom affiché. Les noms communs avec TMDB sont alignés
// (Action, Aventure, Familial) pour que les filtres par genre regroupent films et jeux.
const RAWG_GENRES: Record<string, string> = {
	action: "Action",
	adventure: "Aventure",
	"role-playing-games-rpg": "RPG",
	strategy: "Stratégie",
	shooter: "Tir",
	indie: "Indépendant",
	casual: "Casual",
	simulation: "Simulation",
	puzzle: "Réflexion",
	arcade: "Arcade",
	platformer: "Plateforme",
	"massively-multiplayer": "Multijoueur massif",
	racing: "Course",
	sports: "Sport",
	fighting: "Combat",
	family: "Familial",
	"board-games": "Jeu de société",
	card: "Cartes",
	educational: "Éducatif",
};

// Image affichée quand l'API n'en fournit pas, même format que les mocks
function placeholderCover(title: string): string {
	return `https://placehold.co/300x450?text=${encodeURIComponent(title)}`;
}

// Extrait l'année d'une date "YYYY-MM-DD". Renvoie 0 si la date est vide ou absente.
function yearFromDate(date: string | null): number {
	const year = Number.parseInt(date?.slice(0, 4) ?? "", 10);
	return Number.isNaN(year) ? 0 : year;
}

export function normalizeTmdbMovie(raw: TmdbMovieRaw): NewWatchlistItem {
	return {
		type: "movie",
		title: raw.title,
		cover: raw.poster_path
			? `${TMDB_IMAGE_BASE_URL}${raw.poster_path}`
			: placeholderCover(raw.title),
		releaseYear: yearFromDate(raw.release_date),
		// Les IDs inconnus de la table sont ignorés
		genres: raw.genre_ids.map((id) => TMDB_GENRES[id]).filter((name) => name !== undefined),
	};
}

export function normalizeRawgGame(raw: RawgGameRaw): NewWatchlistItem {
	return {
		type: "game",
		title: raw.name,
		// RAWG renvoie déjà une URL complète
		cover: raw.background_image ?? placeholderCover(raw.name),
		releaseYear: yearFromDate(raw.released),
		// Genre absent de la table : on garde le nom anglais plutôt que de le perdre
		genres: raw.genres.map((genre) => RAWG_GENRES[genre.slug] ?? genre.name),
	};
}
