
# Guide de Déploiement

## Configuration requise

### 1. Secrets GitHub à configurer
Allez dans **Settings > Secrets and variables > Actions** de votre repository et ajoutez :

- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé publique de votre projet Supabase

### 2. Activation GitHub Pages (optionnel)
Si vous voulez utiliser GitHub Pages :
1. Allez dans **Settings > Pages**
2. Source : **Deploy from a branch**
3. Branch : **gh-pages** / **(root)**

## Options de déploiement

### Option A : GitHub Pages
- Le workflow `deploy.yml` déploie automatiquement sur GitHub Pages
- Votre site sera disponible sur : `https://votre-username.github.io/nom-du-repo`
- Modifiez la ligne `cname:` dans le workflow pour votre domaine personnalisé

### Option B : Téléchargement manuel
1. Chaque build crée un artifact `production-build`
2. Téléchargez-le depuis l'onglet **Actions** de votre repo
3. Décompressez et uploadez le contenu sur votre serveur

### Option C : Déploiement sur d'autres plateformes
- **Netlify** : Connectez votre repo GitHub, Netlify détectera automatiquement Vite
- **Vercel** : Import depuis GitHub avec détection automatique
- **Firebase Hosting** : Utilisez les artifacts ou ajoutez un step Firebase au workflow

## Structure des fichiers de production

Le dossier `dist/` contiendra :
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── favicon.ico
```

## Commandes utiles

```bash
# Build local
npm run build

# Preview du build local
npm run preview

# Test du build
npm run build && npm run preview
```
