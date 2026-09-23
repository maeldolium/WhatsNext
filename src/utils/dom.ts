const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// Récupère un élément qui DOIT exister dans la page, en vérifiant son type.
export function getElement<T extends Element>(
	selector: string,
	type: new () => T,
	parent: ParentNode = document,
): T {
	const element = parent.querySelector(selector);
	if (!(element instanceof type)) {
		throw new Error(`Élément « ${selector} » introuvable ou de mauvais type.`);
	}
	return element;
}

// Crée un élément HTML avec sa classe BEM et, si besoin, son texte.
export function createElement<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className: string,
	text?: string,
): HTMLElementTagNameMap[K] {
	const element = document.createElement(tag);
	element.className = className;
	if (text !== undefined) element.textContent = text;
	return element;
}

// Crée une icône qui pointe vers un symbole du sprite (public/sprite.svg).
export function createIcon(name: string, className: string): SVGSVGElement {
	const svg = document.createElementNS(SVG_NAMESPACE, "svg");
	svg.setAttribute("class", className);
	svg.setAttribute("aria-hidden", "true");

	const use = document.createElementNS(SVG_NAMESPACE, "use");
	use.setAttribute("href", `/sprite.svg#${name}`);

	svg.append(use);
	return svg;
}
