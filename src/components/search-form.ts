import { searchGames } from "../api/rawg.ts";
import { searchMovies, searchTvShows } from "../api/tmdb.ts";
import type { NewWatchlistItem, WatchlistStore } from "../types/store.ts";
import type { WatchlistItemType, WatchlistStatus } from "../types/watchlist.ts";
import { STATUS_LABELS, TYPE_LABELS } from "../ui/labels.ts";
import { createElement, getElement } from "../utils/dom.ts";
import { normalizeRawgGame, normalizeTmdbMovie, normalizeTmdbTvShow } from "../utils/normalize.ts";

// Longueur minimale de la recherche, pour éviter des requêtes trop vagues
const MIN_QUERY_LENGTH = 2;

const TYPES: WatchlistItemType[] = ["movie", "tv_show", "game"];
const STATUSES: WatchlistStatus[] = ["planned", "in_progress", "completed"];

// Mêmes libellés que sur les cartes (labels.ts)
const TYPE_OPTIONS = TYPES.map(
	(type) => `<option value="${type}">${TYPE_LABELS[type]}</option>`,
).join("");
const STATUS_OPTIONS = STATUSES.map(
	(status) => `<option value="${status}">${STATUS_LABELS[status]}</option>`,
).join("");

// Structure statique du composant. Aucune donnée venant des API n'est insérée ici,
// donc innerHTML est sans risque. Les résultats, eux, sont créés avec createElement.
const TEMPLATE = `
	<form class="search-form">
		<select name="type" aria-label="Type de recherche">
			${TYPE_OPTIONS}
		</select>
		<input name="query" type="search" placeholder="Rechercher un titre…" required minlength="${MIN_QUERY_LENGTH}" aria-label="Titre" />
		<button type="submit">Rechercher</button>
	</form>
	<p class="search-status" role="status"></p>
	<ul class="search-results"></ul>
	<form class="add-form" hidden>
		<img class="add-cover" alt="" width="100" />
		<!-- Titre et année viennent de l'API : affichés en texte, pas modifiables -->
		<h3 class="add-title"></h3>
		<p class="add-year"></p>
		<label>Statut
			<select name="status">
				${STATUS_OPTIONS}
			</select>
		</label>
		<label>Note <input name="rating" type="number" min="0" max="5" step="1" value="0" /></label>
		<label><input name="favorite" type="checkbox" /> Favori</label>
		<label>Notes <textarea name="notes"></textarea></label>
		<button type="submit">Ajouter à ma liste</button>
		<button type="button" class="add-cancel">Annuler</button>
	</form>
`;

// Appelle la bonne API et renvoie des items déjà au format de l'app
async function search(type: WatchlistItemType, query: string): Promise<NewWatchlistItem[]> {
	switch (type) {
		case "movie":
			return (await searchMovies(query)).map(normalizeTmdbMovie);
		case "tv_show":
			return (await searchTvShows(query)).map(normalizeTmdbTvShow);
		case "game":
			return (await searchGames(query)).map(normalizeRawgGame);
	}
}

// La valeur d'un <select> est une simple chaîne : on vérifie qu'elle fait partie
// des valeurs connues plutôt que de forcer le type avec "as".
function parseType(value: FormDataEntryValue | null): WatchlistItemType {
	return TYPES.find((type) => type === value) ?? "movie";
}

function parseStatus(value: FormDataEntryValue | null): WatchlistStatus {
	return STATUSES.find((status) => status === value) ?? "planned";
}

export interface SearchFormController {
	/** Vide la recherche et ferme le mini-formulaire (ex. à chaque ouverture de la modale) */
	reset(): void;
	/** Ouvre directement le mini-formulaire pour un item déjà connu (ex. une recommandation) */
	prefill(item: NewWatchlistItem): void;
}

/**
 * Affiche dans `container` un formulaire de recherche (films et séries TMDB, jeux RAWG),
 * la liste des résultats, et un mini-formulaire pour compléter l'item avant
 * de l'ajouter au store. `onAdded` est appelé après chaque ajout réussi
 * (par exemple pour fermer la modale).
 */
export function mountSearchForm(
	container: Element,
	store: WatchlistStore,
	onAdded?: () => void,
): SearchFormController {
	container.innerHTML = TEMPLATE;

	const searchForm = getElement(".search-form", HTMLFormElement, container);
	const status = getElement(".search-status", HTMLParagraphElement, container);
	const results = getElement(".search-results", HTMLUListElement, container);
	const addForm = getElement(".add-form", HTMLFormElement, container);
	const addCover = getElement(".add-cover", HTMLImageElement, addForm);
	const addTitle = getElement(".add-title", HTMLHeadingElement, addForm);
	const addYear = getElement(".add-year", HTMLParagraphElement, addForm);
	const statusSelect = getElement('[name="status"]', HTMLSelectElement, addForm);

	// Résultat choisi par l'utilisateur, en attente de validation du mini-formulaire
	let selected: NewWatchlistItem | null = null;
	// Numéro de la dernière recherche lancée. Si l'utilisateur relance une recherche
	// avant la fin de la précédente, la réponse la plus ancienne peut arriver en
	// dernier : on l'ignore pour ne pas écraser les bons résultats.
	let lastSearchId = 0;

	function closeAddForm(): void {
		selected = null;
		addForm.hidden = true;
	}

	function openAddForm(item: NewWatchlistItem): void {
		selected = item;
		addForm.reset();
		// Pas d'image (chaîne vide) : on masque la balise plutôt qu'afficher une image cassée
		addCover.src = item.cover;
		addCover.hidden = item.cover === "";
		// textContent : le titre vient de l'API, il ne doit pas être interprété comme du HTML
		addTitle.textContent = item.title;
		// Année inconnue (0) : on masque la ligne plutôt qu'afficher « 0 »
		addYear.textContent = String(item.releaseYear);
		addYear.hidden = item.releaseYear === 0;
		addForm.hidden = false;
		statusSelect.focus();
	}

	function renderResult(item: NewWatchlistItem): HTMLLIElement {
		const cover = createElement("img", "search-results__cover");
		cover.src = item.cover;
		cover.alt = "";
		cover.width = 60;
		cover.loading = "lazy";
		cover.hidden = item.cover === "";

		// createElement (dom.ts) remplit le texte avec textContent, et non innerHTML :
		// un titre venant de l'API ne peut pas injecter de HTML
		const label = createElement(
			"span",
			"search-results__label",
			item.releaseYear ? `${item.title} (${item.releaseYear})` : item.title,
		);

		const button = createElement("button", "search-results__button");
		button.type = "button";
		button.append(cover, label);
		button.addEventListener("click", () => openAddForm(item));

		const li = createElement("li", "search-results__item");
		li.append(button);
		return li;
	}

	searchForm.addEventListener("submit", async (event) => {
		// Empêche le navigateur de recharger la page à l'envoi du formulaire
		event.preventDefault();

		const data = new FormData(searchForm);
		const type = parseType(data.get("type"));
		const query = String(data.get("query") ?? "").trim();

		// "required" et "minlength" laissent passer une saisie faite uniquement d'espaces
		if (query.length < MIN_QUERY_LENGTH) {
			status.textContent = `Tape au moins ${MIN_QUERY_LENGTH} caractères.`;
			return;
		}

		lastSearchId++;
		const searchId = lastSearchId;
		closeAddForm();
		results.replaceChildren();
		status.textContent = "Recherche en cours…";

		try {
			const items = await search(type, query);
			if (searchId !== lastSearchId) return;
			status.textContent = items.length > 0 ? `${items.length} résultat(s)` : "Aucun résultat.";
			results.replaceChildren(...items.map(renderResult));
		} catch (error) {
			if (searchId !== lastSearchId) return;
			console.error(error);
			status.textContent = "La recherche a échoué, réessaie dans un instant.";
		}
	});

	addForm.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!selected) return;

		// Les attributs HTML (min, max, step) bloquent déjà les valeurs invalides :
		// cet événement n'est déclenché que si le formulaire est valide.
		const data = new FormData(addForm);

		store.addItem({
			// type, titre, année, image et genres viennent de l'API, le reste du formulaire
			...selected,
			status: parseStatus(data.get("status")),
			rating: Number(data.get("rating")),
			// Une case cochée vaut "on" dans FormData, une case décochée est absente
			favorite: data.get("favorite") === "on",
			notes: String(data.get("notes") ?? "").trim(),
		});

		status.textContent = `« ${selected.title} » a été ajouté à ta liste.`;
		closeAddForm();
		onAdded?.();
	});

	getElement(".add-cancel", HTMLButtonElement, addForm).addEventListener("click", closeAddForm);

	function reset(): void {
		// Une recherche encore en cours ne doit pas réafficher ses résultats après le reset
		lastSearchId++;
		searchForm.reset();
		results.replaceChildren();
		status.textContent = "";
		closeAddForm();
	}

	return {
		reset,
		prefill(item) {
			reset();
			openAddForm(item);
		},
	};
}
