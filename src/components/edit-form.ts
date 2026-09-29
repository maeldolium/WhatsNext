import type { WatchlistStore } from "../types/store.ts";
import { showToast } from "../ui/toast.ts";
import { mountItemForm } from "./item-form.ts";

export interface EditFormController {
	/** Renvoie false si l'élément n'existe plus (supprimé entre-temps) */
	open(id: string): boolean;
}

// `onDone` est appelé après l'enregistrement ou l'annulation (ex. pour fermer la modale)
export function mountEditForm(
	container: Element,
	store: WatchlistStore,
	onDone: () => void,
): EditFormController {
	let editedId: string | null = null;

	const form = mountItemForm(container, {
		submitLabel: "Enregistrer",
		onSubmit(values) {
			if (editedId === null) return;
			// Le store applique aussi la règle de l'avis : repasser un titre sur
			// « À découvrir » lui retire sa note et son favori.
			const updated = store.updateItem(editedId, values);
			showToast(`« ${updated.title} » a été modifié.`);
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
