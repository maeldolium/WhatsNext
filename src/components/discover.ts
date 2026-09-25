import { getErrorMessage } from "../api/http.ts";
import { getRecommendations, type Recommendation } from "../api/recommendations.ts";
import type { NewWatchlistItem, WatchlistStore } from "../types/store.ts";
import type { WatchlistItem, WatchlistItemType } from "../types/watchlist.ts";
import { TYPE_LABELS } from "../ui/labels.ts";
import { createElement } from "../utils/dom.ts";

const SECTIONS: { type: WatchlistItemType; title: string }[] = [
	{ type: "movie", title: "Films les mieux notés" },
	{ type: "tv_show", title: "Séries les mieux notées" },
	{ type: "game", title: "Jeux les mieux notés" },
];

// Un titre recommandé est considéré comme déjà ajouté si la collection contient
// un élément du même type, avec le même titre et la même année.
function isInCollection(item: NewWatchlistItem, collection: WatchlistItem[]): boolean {
	return collection.some(
		(owned) =>
			owned.type === item.type &&
			owned.title === item.title &&
			owned.releaseYear === item.releaseYear,
	);
}

// Note avec une décimale et une virgule, à la française : 8,7
function formatScore(score: number): string {
	return score.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Affiche dans `container` la page « Découvrir » : une rangée par type (films,
 * séries, jeux) avec les titres les mieux notés. `onAdd` est appelé au clic sur
 * « Ajouter » d'une carte (par exemple pour ouvrir le formulaire d'ajout).
 */
export function mountDiscover(
	container: HTMLElement,
	store: WatchlistStore,
	onAdd: (item: NewWatchlistItem) => void,
): void {
	// Boutons « Ajouter » de toutes les cartes, pour mettre à jour leur état
	// quand la collection change (ajout ou suppression d'un élément)
	const addButtons = new Map<HTMLButtonElement, NewWatchlistItem>();

	function updateAddButton(button: HTMLButtonElement, item: NewWatchlistItem): void {
		const owned = isInCollection(item, store.getAll());
		button.disabled = owned;
		button.textContent = owned ? "Dans ta collection" : "Ajouter";
	}

	function createRecommendationCard({ item, score }: Recommendation): HTMLLIElement {
		const media = createElement("div", "discover-card__media");
		// Carte sans image, ou image qui ne charge pas : on affiche le titre à la place
		const placeholder = createElement("p", "discover-card__placeholder", item.title);
		placeholder.hidden = item.cover !== "";
		if (item.cover !== "") {
			const cover = createElement("img", "discover-card__cover");
			cover.src = item.cover;
			cover.alt = "";
			cover.loading = "lazy";
			cover.addEventListener("error", () => {
				cover.hidden = true;
				placeholder.hidden = false;
			});
			media.append(cover);
		}
		const scoreBadge = createElement("span", "discover-card__score", `★ ${formatScore(score)}`);
		scoreBadge.setAttribute("aria-label", `Note : ${formatScore(score)} sur 10`);
		media.append(placeholder, scoreBadge);

		// createElement remplit le texte avec textContent : les données des API
		// ne peuvent pas injecter de HTML
		const title = createElement("h3", "discover-card__title", item.title);
		const meta = createElement(
			"p",
			"discover-card__meta",
			item.releaseYear ? `${TYPE_LABELS[item.type]} · ${item.releaseYear}` : TYPE_LABELS[item.type],
		);
		const genres = createElement("p", "discover-card__genres", item.genres.join(" · "));
		genres.hidden = item.genres.length === 0;

		const addButton = createElement("button", "discover-card__add");
		addButton.type = "button";
		addButton.addEventListener("click", () => onAdd(item));
		addButtons.set(addButton, item);
		updateAddButton(addButton, item);

		const card = createElement("li", "discover-card");
		card.append(media, title, meta, genres, addButton);
		return card;
	}

	// Chaque rangée se charge indépendamment : si une API est lente ou en panne,
	// les autres rangées s'affichent quand même.
	async function loadSection(type: WatchlistItemType, status: HTMLElement, list: HTMLElement) {
		try {
			const recommendations = await getRecommendations(type);
			status.hidden = recommendations.length > 0;
			status.textContent = "Aucune recommandation pour le moment.";
			list.replaceChildren(...recommendations.map(createRecommendationCard));
		} catch (error) {
			console.error(error);
			status.textContent = `Impossible de charger les recommandations. ${getErrorMessage(error)}`;
		}
	}

	const sections = SECTIONS.map(({ type, title }) => {
		const status = createElement("p", "discover__status", "Chargement…");
		status.setAttribute("role", "status");
		const list = createElement("ul", "discover__list");

		const section = createElement("section", "discover__section");
		section.append(createElement("h2", "discover__title", title), status, list);
		void loadSection(type, status, list);
		return section;
	});
	container.replaceChildren(...sections);

	// Met à jour les boutons à chaque changement de la collection.
	// subscribe() envoie aussi un premier événement "init" tout de suite.
	store.subscribe(() => {
		for (const [button, item] of addButtons) updateAddButton(button, item);
	});
}
