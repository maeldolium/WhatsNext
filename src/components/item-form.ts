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
			<div>
				<span>Note</span>
				<input name="rating" type="hidden" value="0" />
				<div class="item-form__stars" role="group" aria-label="Note sur 5">
					${[1, 2, 3, 4, 5]
						.map(
							(note) => `
						<button type="button" class="card__star" data-note="${note}" aria-label="${note} sur 5" aria-pressed="false">
							<svg class="card__star-icon" aria-hidden="true">
								<use href="/sprite.svg#icon-star"></use>
							</svg>
						</button>
					`,
						)
						.join("")}
				</div>
			</div>
			<label><input name="favorite" type="checkbox" /> Favori</label>
		</fieldset>
		</fieldset>
		<label>Notes <textarea name="notes" maxlength="${NOTES_MAX_LENGTH}"></textarea></label>
		<button class="item-form__submit" type="submit"></button>
		<button class="item-form__cancel" type="button">Annuler</button>
	</form>
`;

// Ce que l'utilisateur peut choisir. Le reste (titre, année, image…) vient de l'API
// et n'est qu'affiché (ItemFormHeader).
export type ItemFormValues = Pick<WatchlistItem, "status" | "rating" | "favorite" | "notes">;

export type ItemFormHeader = Pick<WatchlistItem, "title" | "releaseYear" | "cover">;

export interface ItemFormOptions {
	submitLabel: string;
	onSubmit: (values: ItemFormValues) => void;
	onCancel: () => void;
}

export interface ItemFormController {
	/** `values` : valeurs actuelles pour pré-remplir le formulaire (édition). Absent pour un ajout. */
	open(header: ItemFormHeader, values?: ItemFormValues): void;
	close(): void;
}

// La valeur d'un <select> est une simple chaîne : on vérifie qu'elle fait partie
// des statuts connus plutôt que de forcer le type avec "as".
function parseStatus(value: FormDataEntryValue | null): WatchlistStatus {
	return STATUSES.find((status) => status === value) ?? "planned";
}

// Mini-formulaire commun à l'ajout (search-form.ts) et à l'édition (edit-form.ts)
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
	const stars = form.querySelectorAll<HTMLButtonElement>("[data-note]");

	// Colore les étoiles jusqu'à la note choisie
	function updateStars(): void {
		const rating = Number(ratingInput.value);

		stars.forEach((star) => {
			const note = Number(star.dataset.note);

			star.classList.toggle("card__star--active", note <= rating);
			star.setAttribute("aria-pressed", String(note === rating));
		});
	}

	stars.forEach((star) => {
		star.addEventListener("click", () => {
			const note = star.dataset.note ?? "0";

			// Recliquer sur la même étoile enlève la note
			ratingInput.value = ratingInput.value === note ? "0" : note;
			updateStars();
		});
	});
	getElement(".item-form__submit", HTMLButtonElement, form).textContent = options.submitLabel;
	form.hidden = true;

	// Pas d'avis pour un titre « À découvrir » (règle de utils/status.ts). Un fieldset
	// désactivé (disabled) n'est ni validé par le navigateur ni envoyé dans FormData :
	// une note saisie avant de repasser sur « À découvrir » n'est donc jamais enregistrée.
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
			// Remet le champ caché à zéro pour un nouvel ajout.
			ratingInput.value = "0";
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
			// Affiche les étoiles de la note enregistrée.
			updateStars();
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
