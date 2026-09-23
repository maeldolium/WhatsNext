import "./style.css";
import "./styles/layout.css";

// Store de démonstration (données pré-remplies). Pour passer au vrai store, remplacer par :
// import { watchlistStore as store } from "./store/store.ts";
// (à faire quand le formulaire de C permettra d'ajouter des éléments : le vrai store démarre vide)
import { mockWatchlistStore as store } from "./store/store.mock.ts";
import { mountFilters } from "./ui/filters.ts";
import { mountPageHeader, setPageSummary, setPageTitle } from "./ui/header.ts";
import { openModal } from "./ui/modal.ts";
import { CATEGORY_TITLES } from "./ui/view.ts";
import { mountWatchlist } from "./ui/watchlist.ts";

// Bouton « Ajouter » : ouvre la fenêtre (le formulaire de C viendra s'y afficher)
mountPageHeader(() => openModal("Ajouter à la collection"));

// Filtres : à chaque changement, on met à jour le titre et on applique la vue à la liste
const filters = mountFilters((view) => {
	setPageTitle(CATEGORY_TITLES[view.category]);
	watchlist.setView(view);
});

// Liste : après chaque mise à jour, on rafraîchit les compteurs, les genres et le sous-titre.
// TEMPORAIRE : en attendant le formulaire de C, « Modifier » ouvre seulement la fenêtre.
const watchlist = mountWatchlist(store, {
	onEdit: (id) => {
		console.info("Édition demandée pour", id);
		openModal("Modifier l'élément");
	},
	onViewApplied: (items, visibleCount) => {
		filters.update(items);
		setPageSummary(visibleCount, items.length);
	},
});
