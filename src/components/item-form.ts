import type { WatchlistItem, WatchlistStatus } from "../types/watchlist.ts";
import { STATUS_LABELS } from "../ui/labels.ts";
import { getElement } from "../utils/dom.ts";
import { canHaveOpinion } from "../utils/status.ts";

const STATUSES: WatchlistStatus[] = ["planned", "in_progress", "completed"];
const NOTES_MAX_LENGTH = 500;

// Mêmes libellés que sur les cartes (labels.ts)
const STATUS_OPTIONS = STATUSES.map(
	(status) => `<option value="${status}">${STATUS_LABELS[status]}</option>`,
).join("");

// Structure statique : aucune donnée venant des API ou de l'utilisateur n'est
// insérée ici, donc innerHTML est sans risque.
const TEMPLATE = `
	<form class="item-form">
		<img class="item-form__cover" alt="" width="100" />
		<!-- Titre et année viennent de l'API : affichés en texte, pas modifiables -->
		<h3 class="item-form__title"></h3>
		<p class="item-form__year"></p>
		<label>Statut
			<select name="status">
				${STATUS_OPTIONS}
			</select>
		</label>
		<!-- Avis : seulement pour un titre commencé (en cours ou terminé), voir updateOpinion() -->
		<fieldset class="item-form__opinion">
			<legend>Ton avis</legend>
			<label>Note <input name="rating" type="number" min="0" max="5" step="1" value="0" /></label>
			<label><input name="favorite" type="checkbox" /> Favori</label>
		</fieldset>
		<label>Notes <textarea name="notes" maxlength="${NOTES_MAX_LENGTH}"></textarea></label>
		<button class="item-form__submit" type="submit"></button>
		<button class="item-form__cancel" type="button">Annuler</button>
	</form>
`;

/** Ce que l'utilisateur peut choisir : le reste (titre, année, image…) vient de l'API */
export type ItemFormValues = Pick<WatchlistItem, "status" | "rating" | "favorite" | "notes">;

/** Ce qui est affiché en lecture seule en haut du formulaire */
export type ItemFormHeader = Pick<WatchlistItem, "title" | "releaseYear" | "cover">;

export interface ItemFormOptions {
	/** Texte du bouton de validation (« Ajouter à ma liste », « Enregistrer »…) */
	submitLabel: string;
	onSubmit: (values: ItemFormValues) => void;
	onCancel: () => void;
}

export interface ItemFormController {
	/** Affiche le formulaire pour un titre, pré-rempli avec `values` s'il y en a (édition) */
	open(header: ItemFormHeader, values?: ItemFormValues): void;
	close(): void;
}

// La valeur d'un <select> est une simple chaîne : on vérifie qu'elle fait partie
// des statuts connus plutôt que de forcer le type avec "as".
function parseStatus(value: FormDataEntryValue | null): WatchlistStatus {
	return STATUSES.find((status) => status === value) ?? "planned";
}

/**
 * Mini-formulaire commun à l'ajout et à l'édition d'un titre : statut, avis (note
 * et favori) et notes personnelles. Le titre, l'année et l'image sont seulement affichés.
 */
export function mountItemForm(container: Element, options: ItemFormOptions): ItemFormController {
	container.innerHTML = TEMPLATE;

	const form = getElement(".item-form", HTMLFormElement, container);
	const cover = getElement(".item-form__cover", HTMLImageElement, form);
	const title = getElement(".item-form__title", HTMLHeadingElement, form);
	const year = getElement(".item-form__year", HTMLParagraphElement, form);
	const statusSelect = getElement('[name="status"]', HTMLSelectElement, form);
	const opinion = getElement(".item-form__opinion", HTMLFieldSetElement, form);
	const ratingInput = getElement('[name="rating"]', HTMLInputElement, form);
	const favoriteInput = getElement('[name="favorite"]', HTMLInputElement, form);
	const notesInput = getElement('[name="notes"]', HTMLTextAreaElement, form);

	getElement(".item-form__submit", HTMLButtonElement, form).textContent = options.submitLabel;
	form.hidden = true;

	// Pas de note ni de favori pour un titre « À découvrir » (règle de utils/status.ts,
	// appliquée aussi par le store et les cartes). Un fieldset désactivé (disabled)
	// n'est ni validé par le navigateur ni envoyé dans FormData : une note saisie
	// avant de repasser sur « À découvrir » n'est donc jamais enregistrée.
	function updateOpinion(): void {
		const canGiveOpinion = canHaveOpinion(parseStatus(statusSelect.value));
		opinion.hidden = !canGiveOpinion;
		opinion.disabled = !canGiveOpinion;
	}

	statusSelect.addEventListener("change", updateOpinion);

	form.addEventListener("submit", (event) => {
		// Empêche le navigateur de recharger la page à l'envoi du formulaire
		event.preventDefault();

		// Les attributs HTML (min, max, step, maxlength) bloquent déjà les valeurs
		// invalides : cet événement n'est déclenché que si le formulaire est valide.
		const data = new FormData(form);
		options.onSubmit({
			status: parseStatus(data.get("status")),
			// Champs absents de FormData quand l'avis est désactivé : note 0, pas favori
			rating: Number(data.get("rating") ?? 0),
			// Une case cochée vaut "on" dans FormData, une case décochée est absente
			favorite: data.get("favorite") === "on",
			notes: String(data.get("notes") ?? "").trim(),
		});
	});

	getElement(".item-form__cancel", HTMLButtonElement, form).addEventListener(
		"click",
		options.onCancel,
	);

	return {
		open(header, values) {
			form.reset();
			// Pas d'image (chaîne vide) : on masque la balise plutôt qu'afficher une image cassée
			cover.src = header.cover;
			cover.hidden = header.cover === "";
			// textContent : le titre vient de l'API, il ne doit pas être interprété comme du HTML
			title.textContent = header.title;
			// Année inconnue (0) : on masque la ligne plutôt qu'afficher « 0 »
			year.textContent = String(header.releaseYear);
			year.hidden = header.releaseYear === 0;

			if (values) {
				statusSelect.value = values.status;
				ratingInput.value = String(values.rating);
				favoriteInput.checked = values.favorite;
				notesInput.value = values.notes;
			}
			// Affiche ou masque l'avis selon le statut (« À découvrir » par défaut après reset)
			updateOpinion();
			form.hidden = false;
			statusSelect.focus();
		},
		close() {
			form.hidden = true;
		},
	};
}
