# WhatsNext

Watchlist de films, séries et jeux vidéo — projet de webapp vanilla TypeScript (Vite, sans framework).

## Installation / lancement

Prérequis : Node.js (version LTS récente) et npm.

```bash
npm install
cp .env.example .env   # puis renseigner les clés API TMDB et RAWG
npm run dev            # serveur de développement avec rechargement à chaud
```

Autres commandes :

```bash
npm run check    # lint + formatage avec Biome (npx biome check --write . pour corriger)
npm run build    # check + vérification TypeScript + build de production dans dist/
npm run preview  # prévisualisation du build de production
```

## Sujet

Développer une application web qui met en pratique les concepts vus en cours :

- Manipulation du DOM via l'API DOM JavaScript
- Proxy pour la synchronisation des données avec le DOM
- Gestion des événements
- Utilisation de l'API Fetch pour interagir avec une API REST
- Stockage local avec LocalStorage ou SessionStorage
- Mode sombre / clair
- Animations CSS
- Responsive design via Grid et Flexbox

### Fonctionnalités attendues

Créer une application, sur le thème de votre choix, qui intègre :

- Affichage d'une liste d'éléments
- Ajout, modification et suppression d'éléments avec mise à jour dynamique
- Système de favoris, likes ou toute autre forme d'interactivité
- Formulaire de saisie avec validation
- Persistance des données en local (pas de backend requis, mais possible)
- Choix du thème sombre / clair / auto
- Animations pour les interactions utilisateur (ajout, suppression, modification)
- Design responsive pour une utilisation sur mobile et desktop
- Maquettes de l'interface réalisées sur un outil de design (Figma, Canva…)

### Contraintes

- L'IA peut être utilisée pour générer du code (Copilot, Claude Code, v0…), mais **chaque partie du code doit être comprise et explicable**.
- Aucun framework ni bibliothèque externe (React, Vue, Angular, jQuery…).
- JavaScript ou TypeScript pur (vanilla), avec Vite.
- Thème original : pas de todo list, gestionnaire de contacts, etc.
- Le thème doit être validé par le professeur.

### Rendu

Une archive contenant le code source du projet et les maquettes.
**Ne pas inclure `node_modules`** (pénalité).

### Évaluation (20 points)

| Critère | Points |
| --- | --- |
| Qualité de la webapp : stabilité, fonctionnalités… | 5 |
| Qualité de l'UX et du design : modes sombre et clair, maquettes… | 5 |
| Compréhension du code : répondre aux questions de l'évaluateur | 5 |
| Maîtrise du code : répondre aux demandes d'évolution de l'évaluateur | 5 |
