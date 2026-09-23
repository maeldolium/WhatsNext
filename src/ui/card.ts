import type { WatchlistItem } from "../types/watchlist.ts";
import { createElement, createIcon, getElement } from "../utils/dom.ts";
import { STATUS_LABELS, TYPE_ICONS, TYPE_LABELS } from "./labels.ts";

const MAX_RATING = 5;

// Crée un bouton d'action. data-action indique au gestionnaire de clics (étape 5) quoi faire.
function createActionButton(action: string, className: string): HTMLButtonElement {
	const button = createElement("button", className);
	button.type = "button";
	button.dataset.action = action;
	return button;
}

// Affiche soit la jaquette, soit le titre en grand quand il n'y a pas d'image (comme sur la maquette)
function showPlaceholder(card: HTMLElement, visible: boolean): void {
	getElement(".card__cover", HTMLImageElement, card).hidden = visible;
	getElement(".card__placeholder", HTMLParagraphElement, card).hidden = !visible;
}

// Construit la STRUCTURE d'une carte (une seule fois par élément), puis la remplit avec updateCard.
export function createCard(item: WatchlistItem): HTMLLIElement {
	const card = createElement("li", "card");
	card.dataset.id = item.id;

	// --- Visuel : jaquette + boutons posés dessus ---
	const media = createElement("div", "card__media");

	const cover = createElement("img", "card__cover");
	cover.alt = ""; // décorative : le titre est déjà écrit juste en dessous
	cover.loading = "lazy";
	cover.addEventListener("error", () => showPlaceholder(card, true));

	const placeholder = createElement("p", "card__placeholder");
	placeholder.setAttribute("aria-hidden", "true"); // doublon du titre, inutile à relire

	const favorite = createActionButton("favorite", "card__favorite");
	favorite.append(createIcon("icon-heart", "card__favorite-icon"));

	const menuToggle = createActionButton("menu", "card__menu-toggle");
	menuToggle.setAttribute("aria-label", "Plus d'actions");
	menuToggle.setAttribute("aria-haspopup", "true");
	menuToggle.setAttribute("aria-expanded", "false");
	menuToggle.setAttribute("aria-controls", `card-menu-${item.id}`);
	menuToggle.append(createIcon("icon-more", "card__menu-toggle-icon"));

	const menu = createElement("div", "card__menu");
	menu.id = `card-menu-${item.id}`;
	menu.hidden = true;
	const editButton = createActionButton("edit", "card__menu-item");
	editButton.append(createIcon("icon-edit", "card__menu-item-icon"), "Modifier");
	const deleteButton = createActionButton("delete", "card__menu-item card__menu-item--danger");
	deleteButton.append(createIcon("icon-trash", "card__menu-item-icon"), "Supprimer");
	menu.append(editButton, deleteButton);

	const status = createElement("span", "card__status");

	media.append(cover, placeholder, favorite, menuToggle, menu, status);

	// --- Contenu textuel ---
	const body = createElement("div", "card__body");
	const title = createElement("h3", "card__title");

	const meta = createElement("p", "card__meta");
	meta.append(createElement("span", "card__type"), createElement("span", "card__year"));

	const genres = createElement("p", "card__genres");

	const rating = createElement("div", "card__rating");
	rating.setAttribute("role", "group");
	rating.setAttribute("aria-label", "Ma note");
	for (let value = 1; value <= MAX_RATING; value++) {
		const star = createActionButton("rate", "card__star");
		star.dataset.value = String(value);
		star.setAttribute("aria-label", `${value} sur ${MAX_RATING}`);
		star.append(createIcon("icon-star", "card__star-icon"));
		rating.append(star);
	}
	rating.append(createElement("span", "card__rating-value"));

	const notes = createElement("p", "card__notes");

	body.append(title, meta, genres, rating, notes);
	card.append(media, body);

	updateCard(card, item);
	return card;
}

// Écrit les DONNÉES dans une carte existante, sans rien recréer.
// Appelée à la création, puis à chaque événement "update" du store.
export function updateCard(card: HTMLElement, item: WatchlistItem): void {
	// Modificateurs BEM : toggle(classe, condition) ajoute la classe si vrai, la retire si faux
	for (const type of Object.keys(TYPE_LABELS)) {
		card.classList.toggle(`card--${type}`, item.type === type);
	}
	for (const status of Object.keys(STATUS_LABELS)) {
		// "in_progress" devient "card--in-progress" : en BEM, les mots sont séparés par des tirets
		card.classList.toggle(`card--${status.replaceAll("_", "-")}`, item.status === status);
	}
	card.classList.toggle("card--favorite", item.favorite);

	// Jaquette : on ne touche à src que si l'URL a changé, sinon l'image serait rechargée
	const cover = getElement(".card__cover", HTMLImageElement, card);
	if (!item.cover) {
		cover.removeAttribute("src");
		showPlaceholder(card, true);
	} else if (cover.getAttribute("src") !== item.cover) {
		cover.src = item.cover;
		showPlaceholder(card, false);
	}
	getElement(".card__placeholder", HTMLParagraphElement, card).textContent = item.title;

	const favorite = getElement(".card__favorite", HTMLButtonElement, card);
	favorite.setAttribute("aria-pressed", String(item.favorite));
	favorite.setAttribute("aria-label", `Favori : ${item.title}`);

	getElement(".card__status", HTMLSpanElement, card).textContent = STATUS_LABELS[item.status];
	getElement(".card__title", HTMLHeadingElement, card).textContent = item.title;
	getElement(".card__type", HTMLSpanElement, card).replaceChildren(
		createIcon(TYPE_ICONS[item.type], "card__type-icon"),
		TYPE_LABELS[item.type],
	);
	getElement(".card__year", HTMLSpanElement, card).textContent = String(item.releaseYear);

	const genres = getElement(".card__genres", HTMLParagraphElement, card);
	genres.textContent = item.genres.join(" · ");
	genres.hidden = item.genres.length === 0;

	for (const star of card.querySelectorAll<HTMLButtonElement>(".card__star")) {
		const value = Number(star.dataset.value);
		star.classList.toggle("card__star--active", value <= item.rating);
		star.setAttribute("aria-pressed", String(value === item.rating));
	}
	getElement(".card__rating-value", HTMLSpanElement, card).textContent =
		item.rating > 0 ? `${item.rating}/${MAX_RATING}` : "—";

	const notes = getElement(".card__notes", HTMLParagraphElement, card);
	notes.textContent = item.notes;
	notes.hidden = item.notes === "";
}
