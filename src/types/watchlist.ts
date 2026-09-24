export type WatchlistItemType = "movie" | "tv_show" | "game";

export type WatchlistStatus = "planned" | "in_progress" | "completed";

export interface WatchlistItem {
	id: string;
	type: WatchlistItemType;
	title: string;
	cover: string;
	releaseYear: number;
	status: WatchlistStatus;
	rating: number;
	favorite: boolean;
	notes: string;
	genres: string[];
	dateAdded: string;
	dateUpdated: string;
}
