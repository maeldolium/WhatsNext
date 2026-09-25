import "./style.css";
import "./styles/layout.css";

import { mountDiscover } from "./components/discover.ts";
import { mountEditForm } from "./components/edit-form.ts";
import { mountSearchForm } from "./components/search-form.ts";
// Vrai store : la collection démarre vide et se remplit avec les titres ajoutés depuis
// la recherche ou « Découvrir ». Pour tester avec des données de démonstration, remplacer par :
// import { mockWatchlistStore as store } from "./store/store.mock.ts";
import { watchlistStore as store } from "./store/store.ts";
import { mountFilters } from "./ui/filters.ts";
import { mountPageHeader, setPageSubtitle, setPageSummary, setPageTitle } from "./ui/header.ts";
import { closeModal, openModal } from "./ui/modal.ts";
import { getCurrentPage, showPage } from "./ui/pages.ts";
import { CATEGORY_TITLES } from "./ui/view.ts";
import { mountWatchlist } from "./ui/watchlist.ts";
import { createElement, getElement } from "./utils/dom.ts";

// La modale contient deux formulaires : l'ajout (recherche TMDB / RAWG) et la
// modification d'un élément. On n'affiche que celui qui correspond au bouton cliqué.
const addRoot = createElement("div", "modal__add");
const editRoot = createElement("div", "modal__edit");
getElement("#form-root", HTMLDivElement).append(addRoot, editRoot);

const searchForm = mountSearchForm(addRoot, store, closeModal);
const editForm = mountEditForm(editRoot, store, closeModal);

function openAddModal(): void {
	addRoot.hidden = false;
	editRoot.hidden = true;
	openModal("Ajouter à la collection");
}

mountPageHeader(() => {
	searchForm.reset();
	openAddModal();
});

// Page d'accueil « Découvrir ». « Ajouter » sur une carte ouvre la modale avec le
// mini-formulaire déjà pré-rempli : il ne reste qu'à choisir statut, note, etc.
mountDiscover(getElement(".discover", HTMLElement), store, (item) => {
	searchForm.prefill(item);
	openAddModal();
});

function showDiscover(): void {
	showPage("discover");
	setPageTitle("Découvrir");
	setPageSubtitle("Les films, séries et jeux les mieux notés");
}

getElement('.nav__button[data-page="discover"]', HTMLButtonElement).addEventListener(
	"click",
	showDiscover,
);

// Un clic sur une catégorie (Ma collection, Films…) affiche la page collection
const filters = mountFilters((view) => {
	showPage("collection");
	setPageTitle(CATEGORY_TITLES[view.category]);
	watchlist.setView(view);
});

const watchlist = mountWatchlist(store, {
	onEdit: (id) => {
		if (!editForm.open(id)) return;
		addRoot.hidden = true;
		editRoot.hidden = false;
		openModal("Modifier l'élément");
	},
	onViewApplied: (items, visibleCount) => {
		filters.update(items);
		// Le résumé « X entrées » ne concerne que la page collection
		if (getCurrentPage() === "collection") setPageSummary(visibleCount, items.length);
	},
});

showDiscover();
