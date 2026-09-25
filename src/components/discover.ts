import { getErrorMessage } from "../api/http.ts";
import { getRecommendations, type Recommendation } from "../api/recommendations.ts";
import type { NewWatchlistItem, WatchlistStore } from "../types/store.ts";
import type { WatchlistItemType } from "../types/watchlist.ts";
import { TYPE_LABELS } from "../ui/labels.ts";
import { isInCollection, titleKey } from "../utils/collection.ts";
import { createElement } from "../utils/dom.ts";

const SECTIONS: { type: WatchlistItemType; title: string }[] = [
	{ type: "movie", title: "Films les mieux notés" },
	{ type: "tv_show", title: "Séries les mieux notées" },
	{ type: "game", title: "Jeux les mieux notés" },
];

// Nombre de titres affichés par rangée
const VISIBLE_PER_SECTION = 20;
// Nombre maximum de pages du classement chargées par rangée (20 titres par page).
// Évite d'enchaîner les requêtes si la collection contient déjà une grande partie
// du classement.
const MAX_PAGES = 10;

// État d'une rangée
interface Section {
	type: WatchlistItemType;
	status: HTMLElement;
	list: HTMLElement;
	/** Classement chargé jusqu'ici, dans l'ordre, y compris les titres déjà dans la collection */
	ranking: Recommendation[];
	nextPage: number;
	/** Plus de page à charger (fin du classement ou MAX_PAGES atteint) */
	exhausted: boolean;
	loading: boolean;
}

// Note avec une décimale et une virgule, à la française : 8,7
function formatScore(score: number): string {
	return score.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Affiche dans `container` la page « Découvrir » : une rangée par type (films,
 * séries, jeux) avec les titres les mieux notés qui ne sont pas encore dans la
 * collection. Quand un titre est ajouté, il disparaît et le suivant du classement
 * prend sa place ; s'il est retiré de la collection, il revient à sa place.
 * `onAdd` est appelé au clic sur « Ajouter » d'une carte (ex. pour ouvrir le formulaire).
 */
export function mountDiscover(
	container: HTMLElement,
	store: WatchlistStore,
	onAdd: (item: NewWatchlistItem) => void,
): void {
	// Cartes déjà créées, par titre : un titre qui revient (après une suppression
	// de la collection) réutilise sa carte au lieu d'en recréer une
	const cards = new Map<string, HTMLLIElement>();

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

		const addButton = createElement("button", "discover-card__add", "Ajouter");
		addButton.type = "button";
		addButton.addEventListener("click", () => onAdd(item));

		const card = createElement("li", "discover-card");
		card.append(media, title, meta, genres, addButton);
		return card;
	}

	function getCard(recommendation: Recommendation): HTMLLIElement {
		const key = titleKey(recommendation.item);
		let card = cards.get(key);
		if (!card) {
			card = createRecommendationCard(recommendation);
			cards.set(key, card);
		}
		return card;
	}

	/** Les titres à afficher : les premiers du classement qui ne sont pas dans la collection */
	function visibleRecommendations(section: Section): Recommendation[] {
		const collection = store.getAll();
		return section.ranking
			.filter((recommendation) => !isInCollection(recommendation.item, collection))
			.slice(0, VISIBLE_PER_SECTION);
	}

	function render(section: Section): void {
		const visible = visibleRecommendations(section);
		section.list.replaceChildren(...visible.map(getCard));
		if (visible.length > 0) {
			section.status.hidden = true;
		} else if (section.exhausted) {
			section.status.hidden = false;
			section.status.textContent =
				"Tu as déjà tous les titres de ce classement dans ta collection !";
		}
	}

	// Charge les pages suivantes du classement tant qu'il manque des titres à afficher.
	// Chaque rangée se charge indépendamment : si une API est lente ou en panne,
	// les autres rangées s'affichent quand même.
	async function fill(section: Section): Promise<void> {
		// Un seul chargement à la fois par rangée (plusieurs ajouts rapprochés)
		if (section.loading) return;
		section.loading = true;
		try {
			while (visibleRecommendations(section).length < VISIBLE_PER_SECTION && !section.exhausted) {
				const page = await getRecommendations(section.type, section.nextPage);
				section.nextPage++;
				// Le classement peut bouger entre deux requêtes : on ignore un titre déjà reçu
				const known = new Set(
					section.ranking.map((recommendation) => titleKey(recommendation.item)),
				);
				section.ranking.push(
					...page.filter((recommendation) => !known.has(titleKey(recommendation.item))),
				);
				if (page.length === 0 || section.nextPage > MAX_PAGES) section.exhausted = true;
				render(section);
			}
		} catch (error) {
			console.error(error);
			// Si des titres sont déjà affichés, on les garde : seule la suite n'a pas pu être chargée
			if (visibleRecommendations(section).length === 0) {
				section.status.hidden = false;
				section.status.textContent = `Impossible de charger les recommandations. ${getErrorMessage(error)}`;
			}
		} finally {
			section.loading = false;
		}
	}

	const sections: Section[] = SECTIONS.map(({ type }) => ({
		type,
		status: createElement("p", "discover__status", "Chargement…"),
		list: createElement("ul", "discover__list"),
		ranking: [],
		nextPage: 1,
		exhausted: false,
		loading: false,
	}));

	container.replaceChildren(
		...sections.map((section, index) => {
			section.status.setAttribute("role", "status");
			const element = createElement("section", "discover__section");
			element.append(
				createElement("h2", "discover__title", SECTIONS[index].title),
				section.status,
				section.list,
			);
			return element;
		}),
	);

	// À chaque changement de la collection (et tout de suite, avec l'événement "init"
	// envoyé par subscribe) : on met à jour les rangées et on complète celles qui en ont besoin.
	store.subscribe(() => {
		for (const section of sections) {
			render(section);
			void fill(section);
		}
	});
}
