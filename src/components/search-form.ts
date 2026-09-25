import { getErrorMessage } from "../api/http.ts";
import { searchGames } from "../api/rawg.ts";
import { searchMovies, searchTvShows } from "../api/tmdb.ts";
import type { NewWatchlistItem, WatchlistStore } from "../types/store.ts";
import type { WatchlistItemType } from "../types/watchlist.ts";
import { TYPE_LABELS } from "../ui/labels.ts";
import { isInCollection } from "../utils/collection.ts";
import { createElement, getElement } from "../utils/dom.ts";
import { normalizeRawgGame, normalizeTmdbMovie, normalizeTmdbTvShow } from "../utils/normalize.ts";
import { mountItemForm } from "./item-form.ts";

// Longueur minimale de la recherche, pour éviter des requêtes trop vagues
const MIN_QUERY_LENGTH = 2;

const TYPES: WatchlistItemType[] = ["movie", "tv_show", "game"];

// Mêmes libellés que sur les cartes (labels.ts)
const TYPE_OPTIONS = TYPES.map(
	(type) => `<option value="${type}">${TYPE_LABELS[type]}</option>`,
).join("");

// Structure statique du composant. Aucune donnée venant des API n'est insérée ici,
// donc innerHTML est sans risque. Les résultats, eux, sont créés avec createElement.
const TEMPLATE = `
	<div class="search-panel">
		<form class="search-form">
			<select name="type" aria-label="Type de recherche">
				${TYPE_OPTIONS}
			</select>
			<input name="query" type="search" placeholder="Rechercher un titre…" required minlength="${MIN_QUERY_LENGTH}" aria-label="Titre" />
			<button type="submit">Rechercher</button>
		</form>
		<p class="search-status" role="status"></p>
		<ul class="search-results"></ul>
	</div>
	<!-- Mini-formulaire d'ajout (item-form.ts) -->
	<div class="search-add"></div>
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

export interface SearchFormController {
	/** Affiche la recherche vide, sans mini-formulaire (bouton « Ajouter » du header) */
	reset(): void;
	/**
	 * Affiche uniquement le mini-formulaire pour un item déjà connu, sans la recherche
	 * (bouton « Ajouter » d'une recommandation)
	 */
	prefill(item: NewWatchlistItem): void;
}

/**
 * Affiche dans `container` un formulaire de recherche (films et séries TMDB, jeux RAWG),
 * la liste des résultats, et un mini-formulaire pour compléter l'item avant
 * de l'ajouter au store. `onDone` est appelé quand il n'y a plus rien à faire dans
 * le formulaire (par exemple pour fermer la modale) : après un ajout, ou après
 * « Annuler » sur un item ouvert avec prefill().
 */
export function mountSearchForm(
	container: Element,
	store: WatchlistStore,
	onDone?: () => void,
): SearchFormController {
	container.innerHTML = TEMPLATE;

	const searchPanel = getElement(".search-panel", HTMLDivElement, container);
	const searchForm = getElement(".search-form", HTMLFormElement, container);
	const status = getElement(".search-status", HTMLParagraphElement, container);
	const results = getElement(".search-results", HTMLUListElement, container);

	// Résultat choisi par l'utilisateur, en attente de validation du mini-formulaire
	let selected: NewWatchlistItem | null = null;
	// Numéro de la dernière recherche lancée. Si l'utilisateur relance une recherche
	// avant la fin de la précédente, la réponse la plus ancienne peut arriver en
	// dernier : on l'ignore pour ne pas écraser les bons résultats.
	let lastSearchId = 0;

	const addForm = mountItemForm(getElement(".search-add", HTMLDivElement, container), {
		submitLabel: "Ajouter à ma liste",
		onSubmit(values) {
			if (!selected) return;
			// type, titre, année, image et genres viennent de l'API, le reste du formulaire
			store.addItem({ ...selected, ...values });
			status.textContent = `« ${selected.title} » a été ajouté à ta liste.`;
			closeAddForm();
			onDone?.();
		},
		onCancel() {
			closeAddForm();
			// Ouvert depuis une recommandation : il n'y a pas de recherche derrière à laquelle revenir
			if (searchPanel.hidden) onDone?.();
		},
	});

	function closeAddForm(): void {
		selected = null;
		addForm.close();
	}

	function openAddForm(item: NewWatchlistItem): void {
		selected = item;
		addForm.open(item);
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
		// Titre déjà dans la collection : on l'indique et on empêche de l'ajouter une 2e fois
		if (isInCollection(item, store.getAll())) {
			button.disabled = true;
			button.append(createElement("span", "search-results__owned", "Dans ta collection"));
		} else {
			button.addEventListener("click", () => openAddForm(item));
		}

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
			status.textContent = `La recherche a échoué. ${getErrorMessage(error)}`;
		}
	});

	function reset(): void {
		// Une recherche encore en cours ne doit pas réafficher ses résultats après le reset
		lastSearchId++;
		searchForm.reset();
		results.replaceChildren();
		status.textContent = "";
		searchPanel.hidden = false;
		closeAddForm();
	}

	return {
		reset,
		prefill(item) {
			reset();
			searchPanel.hidden = true;
			openAddForm(item);
		},
	};
}
