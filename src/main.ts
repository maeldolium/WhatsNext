import "./style.css";
import "./styles/layout.css";

import { mountDiscover } from "./components/discover.ts";
import { mountSearchForm } from "./components/search-form.ts";
// Store de démonstration (données pré-remplies). Pour passer au vrai store, remplacer par :
// import { watchlistStore as store } from "./store/store.ts";
// (à faire quand le formulaire de C permettra d'ajouter des éléments : le vrai store démarre vide)
import { mockWatchlistStore as store } from "./store/store.mock.ts";
import { mountFilters } from "./ui/filters.ts";
import { mountPageHeader, setPageSubtitle, setPageSummary, setPageTitle } from "./ui/header.ts";
import { closeModal, openModal } from "./ui/modal.ts";
import { getCurrentPage, showPage } from "./ui/pages.ts";
import { CATEGORY_TITLES } from "./ui/view.ts";
import { mountWatchlist } from "./ui/watchlist.ts";
import { getElement } from "./utils/dom.ts";

// Formulaire de recherche TMDB / RAWG, affiché dans la modale « Ajouter »
const searchForm = mountSearchForm(getElement("#form-root", HTMLDivElement), store, closeModal);

mountPageHeader(() => {
	searchForm.reset();
	openModal("Ajouter à la collection");
});

// Page d'accueil « Découvrir ». « Ajouter » sur une carte ouvre la modale avec le
// mini-formulaire déjà pré-rempli : il ne reste qu'à choisir statut, note, etc.
mountDiscover(getElement(".discover", HTMLElement), store, (item) => {
	searchForm.prefill(item);
	openModal("Ajouter à la collection");
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

// TEMPORAIRE : en attendant le formulaire de C, « Modifier » ouvre seulement la fenêtre.
const watchlist = mountWatchlist(store, {
	onEdit: () => {
		openModal("Modifier l'élément");
	},
	onViewApplied: (items, visibleCount) => {
		filters.update(items);
		// Le résumé « X entrées » ne concerne que la page collection
		if (getCurrentPage() === "collection") setPageSummary(visibleCount, items.length);
	},
});

showDiscover();
