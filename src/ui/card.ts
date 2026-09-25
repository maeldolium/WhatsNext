import type { WatchlistItem } from "../types/watchlist.ts";
import { createElement, createIcon, getElement } from "../utils/dom.ts";
import { canHaveOpinion } from "../utils/status.ts";
import { STATUS_LABELS, TYPE_ICONS, TYPE_LABELS } from "./labels.ts";

const MAX_RATING = 5;

function createActionButton(action: string, className: string): HTMLButtonElement {
	const button = createElement("button", className);
	button.type = "button";
	button.dataset.action = action;
	return button;
}

function showPlaceholder(card: HTMLElement, visible: boolean): void {
	getElement(".card__cover", HTMLImageElement, card).hidden = visible;
	getElement(".card__placeholder", HTMLParagraphElement, card).hidden = !visible;
}

export function createCard(item: WatchlistItem): HTMLLIElement {
	const card = createElement("li", "card");
	card.dataset.id = item.id;

	const media = createElement("div", "card__media");

	const cover = createElement("img", "card__cover");
	cover.loading = "lazy";
	cover.addEventListener("error", () => showPlaceholder(card, true));

	const placeholder = createElement("p", "card__placeholder");

	const favorite = createActionButton("favorite", "card__favorite");
	favorite.append(createIcon("icon-heart", "card__favorite-icon"));

	const menuToggle = createActionButton("menu", "card__menu-toggle");
	menuToggle.append(createIcon("icon-more", "card__menu-toggle-icon"));

	const menu = createElement("div", "card__menu");
	menu.hidden = true;
	const editButton = createActionButton("edit", "card__menu-item");
	editButton.append(createIcon("icon-edit", "card__menu-item-icon"), "Modifier");
	const deleteButton = createActionButton("delete", "card__menu-item card__menu-item--danger");
	deleteButton.append(createIcon("icon-trash", "card__menu-item-icon"), "Supprimer");
	menu.append(editButton, deleteButton);

	const status = createElement("span", "card__status");

	media.append(cover, placeholder, favorite, menuToggle, menu, status);

	const body = createElement("div", "card__body");
	const title = createElement("h3", "card__title");

	const meta = createElement("p", "card__meta");
	meta.append(createElement("span", "card__type"), createElement("span", "card__year"));

	const genres = createElement("p", "card__genres");

	const rating = createElement("div", "card__rating");
	for (let value = 1; value <= MAX_RATING; value++) {
		const star = createActionButton("rate", "card__star");
		star.dataset.value = String(value);
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

export function updateCard(card: HTMLElement, item: WatchlistItem): void {
	for (const type of Object.keys(TYPE_LABELS)) {
		card.classList.toggle(`card--${type}`, item.type === type);
	}
	for (const status of Object.keys(STATUS_LABELS)) {
		card.classList.toggle(`card--${status.replaceAll("_", "-")}`, item.status === status);
	}
	card.classList.toggle("card--favorite", item.favorite);

	// Pas de note ni de favori sur un titre « À découvrir » (même règle que le store)
	const opinionAllowed = canHaveOpinion(item.status);
	getElement(".card__favorite", HTMLButtonElement, card).hidden = !opinionAllowed;
	getElement(".card__rating", HTMLDivElement, card).hidden = !opinionAllowed;

	// On ne touche à src que si l'URL a changé, sinon l'image serait rechargée
	const cover = getElement(".card__cover", HTMLImageElement, card);
	if (!item.cover) {
		cover.removeAttribute("src");
		showPlaceholder(card, true);
	} else if (cover.getAttribute("src") !== item.cover) {
		cover.src = item.cover;
		showPlaceholder(card, false);
	}
	getElement(".card__placeholder", HTMLParagraphElement, card).textContent = item.title;

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
		star.classList.toggle("card__star--active", Number(star.dataset.value) <= item.rating);
	}
	getElement(".card__rating-value", HTMLSpanElement, card).textContent =
		item.rating > 0 ? `${item.rating}/${MAX_RATING}` : "—";

	const notes = getElement(".card__notes", HTMLParagraphElement, card);
	notes.textContent = item.notes;
	notes.hidden = item.notes === "";
}
