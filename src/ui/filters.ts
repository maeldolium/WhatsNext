import type { WatchlistItem } from "../types/watchlist.ts";
import { getElement } from "../utils/dom.ts";
import {
	type Category,
	DEFAULT_VIEW,
	matchesCategory,
	type SortKey,
	type StatusFilter,
	type ViewState,
} from "./view.ts";

export interface FiltersController {
	// À appeler quand les données changent : met à jour les compteurs et la liste des genres
	update(items: WatchlistItem[]): void;
}

// Active un bouton d'un groupe (classe BEM + aria-pressed) et désactive tous les autres
function setActiveButton(
	buttons: NodeListOf<HTMLButtonElement>,
	active: HTMLButtonElement,
	activeClass: string,
): void {
	for (const button of buttons) {
		const isActive = button === active;
		button.classList.toggle(activeClass, isActive);
		button.setAttribute("aria-pressed", String(isActive));
	}
}

// Branche tous les contrôles de filtre. onChange reçoit la nouvelle vue à chaque modification.
export function mountFilters(onChange: (view: ViewState) => void): FiltersController {
	const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav__button");
	const statusButtons = document.querySelectorAll<HTMLButtonElement>(".status-filter__button");
	const searchInput = getElement("#search-input", HTMLInputElement);
	const sortSelect = getElement("#sort-select", HTMLSelectElement);
	const genreSelect = getElement("#genre-select", HTMLSelectElement);

	let view: ViewState = { ...DEFAULT_VIEW };
	// Liste des genres actuellement affichée, pour ne reconstruire le <select> que si elle change
	let genresKey = "";

	function change(changes: Partial<ViewState>): void {
		view = { ...view, ...changes };
		onChange(view);
	}

	// Navigation latérale (délégation)
	getElement(".nav__list", HTMLUListElement).addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;
		const button = event.target.closest<HTMLButtonElement>(".nav__button");
		if (!button) return;
		setActiveButton(navButtons, button, "nav__button--active");
		change({ category: button.dataset.filter as Category });
	});

	// Filtres de statut (délégation)
	getElement(".status-filter", HTMLDivElement).addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;
		const button = event.target.closest<HTMLButtonElement>(".status-filter__button");
		if (!button) return;
		setActiveButton(statusButtons, button, "status-filter__button--active");
		change({ status: button.dataset.status as StatusFilter });
	});

	// "input" : à chaque frappe (et à l'effacement par la croix du champ de recherche)
	searchInput.addEventListener("input", () => change({ search: searchInput.value }));
	sortSelect.addEventListener("change", () => change({ sort: sortSelect.value as SortKey }));
	genreSelect.addEventListener("change", () => change({ genre: genreSelect.value }));

	function updateCounts(items: WatchlistItem[]): void {
		for (const button of navButtons) {
			const category = button.dataset.filter as Category;
			const count = items.filter((item) => matchesCategory(item, category)).length;
			getElement(".nav__count", HTMLSpanElement, button).textContent = String(count);
		}
	}

	function updateGenreOptions(items: WatchlistItem[]): void {
		// Set : chaque genre une seule fois, même s'il apparaît dans plusieurs éléments
		const genres = [...new Set(items.flatMap((item) => item.genres))];
		// On garde le genre sélectionné même si plus aucun élément ne l'a (sinon la sélection sauterait)
		if (view.genre !== "" && !genres.includes(view.genre)) genres.push(view.genre);
		genres.sort((a, b) => a.localeCompare(b, "fr"));

		const key = genres.join("|");
		if (key === genresKey) return;
		genresKey = key;

		genreSelect.replaceChildren(
			new Option("Tous les genres", ""),
			...genres.map((genre) => new Option(genre, genre)),
		);
		genreSelect.value = view.genre;
	}

	return {
		update(items) {
			updateCounts(items);
			updateGenreOptions(items);
		},
	};
}
