import type { WatchlistStore } from "../types/store.ts";
import { mountItemForm } from "./item-form.ts";

export interface EditFormController {
	/**
	 * Ouvre le formulaire pré-rempli avec les valeurs actuelles de l'élément.
	 * Renvoie false si l'élément n'existe plus (supprimé entre-temps).
	 */
	open(id: string): boolean;
}

/**
 * Formulaire de modification d'un élément de la collection : statut, avis (note et
 * favori) et notes. Mêmes champs et mêmes règles que l'ajout (item-form.ts).
 * `onDone` est appelé après l'enregistrement ou l'annulation (ex. pour fermer la modale).
 */
export function mountEditForm(
	container: Element,
	store: WatchlistStore,
	onDone: () => void,
): EditFormController {
	// Id de l'élément en cours de modification
	let editedId: string | null = null;

	const form = mountItemForm(container, {
		submitLabel: "Enregistrer",
		onSubmit(values) {
			if (editedId === null) return;
			// Le store applique aussi la règle de l'avis : repasser un titre sur
			// « À découvrir » lui retire sa note et son favori.
			store.updateItem(editedId, values);
			editedId = null;
			onDone();
		},
		onCancel() {
			editedId = null;
			onDone();
		},
	});

	return {
		open(id) {
			const item = store.getAll().find((candidate) => candidate.id === id);
			if (!item) return false;
			editedId = id;
			form.open(item, item);
			return true;
		},
	};
}
