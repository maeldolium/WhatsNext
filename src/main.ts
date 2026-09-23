import "./style.css";
import "./styles/layout.css";

import { mockWatchlistStore as store } from "./store/store.mock.ts";

// Page de test temporaire du store, en attendant le vrai rendu (partie B).
// Pour repartir des données de démo : vider localStorage dans les DevTools.

function getElement(selector: string): Element {
	const element = document.querySelector(selector);
	if (!element) throw new Error(`Élément ${selector} introuvable`);
	return element;
}

getElement("#app").innerHTML = `
	<h1>WhatsNext — test du store</h1>
	<p>Ouvre la console (F12) pour voir les événements. Recharge la page : les données persistent.</p>
	<p>
		<button id="add">Ajouter un film</button>
		<button id="rate">Noter le dernier 5/5</button>
		<button id="favorite">Favori du dernier</button>
		<button id="complete">Terminer le dernier</button>
		<button id="delete">Supprimer le dernier</button>
	</p>
	<pre id="output"></pre>
`;

const output = getElement("#output");

// Ici on réaffiche toute la liste à chaque événement : c'est acceptable pour un test,
// mais le vrai rendu (partie B) ne devra mettre à jour que l'élément concerné.
store.subscribe((event) => {
	console.log(`[store] ${event.type}`, event);
	output.textContent = JSON.stringify(store.getAll(), null, 2);
});

function lastItemId(): string | undefined {
	return store.getAll().at(-1)?.id;
}

getElement("#add").addEventListener("click", () => {
	store.addItem({
		type: "movie",
		title: `Film de test n°${store.getAll().length + 1}`,
		cover: "https://placehold.co/300x450?text=Test",
		releaseYear: 2024,
		genres: ["Test"],
	});
});

getElement("#rate").addEventListener("click", () => {
	const id = lastItemId();
	if (id) store.setRating(id, 5);
});

getElement("#favorite").addEventListener("click", () => {
	const id = lastItemId();
	if (id) store.toggleFavorite(id);
});

getElement("#complete").addEventListener("click", () => {
	const id = lastItemId();
	if (id) store.setStatus(id, "completed");
});

getElement("#delete").addEventListener("click", () => {
	const id = lastItemId();
	if (id) store.deleteItem(id);
});
