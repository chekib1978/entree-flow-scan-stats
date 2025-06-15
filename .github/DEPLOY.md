
# Guide de Déploiement

## Configuration requise

### 1. Secrets GitHub à configurer
Allez dans **Settings > Secrets and variables > Actions** de votre repository et ajoutez :

- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé publique de votre projet Supabase

### 2. Activation GitHub Pages
**IMPORTANT** : Pour que le déploiement fonctionne, vous devez configurer GitHub Pages :

1. Allez dans **Settings > Pages** de votre repository
2. **Source** : Sélectionnez **"GitHub Actions"** (pas "Deploy from a branch")
3. Sauvegardez les paramètres

**Note importante** : Si vous obtenez l'erreur "Get Pages site failed", cela signifie que GitHub Pages n'est pas encore activé pour votre repository. Vous devez d'abord activer GitHub Pages en suivant les étapes ci-dessus.

### 3. Permissions GitHub Actions
Le workflow a été configuré avec les permissions nécessaires :
- `contents: read` - pour lire le code
- `pages: write` - pour déployer sur GitHub Pages  
- `id-token: write` - pour l'authentification

## Résolution des erreurs communes

### Erreur 403 (Permissions insuffisantes)
L'erreur était due à :
1. Permissions insuffisantes dans le workflow
2. Configuration GitHub Pages incorrecte

### Erreur "Get Pages site failed"
Cette erreur signifie que GitHub Pages n'est pas activé. Pour la résoudre :
1. Allez dans **Settings > Pages** de votre repository
2. Activez GitHub Pages en sélectionnant "GitHub Actions" comme source
3. Si l'option n'est pas disponible, votre repository doit être public ou vous devez avoir un plan GitHub Pro/Team

### Repository privé
Si votre repository est privé, vous avez besoin d'un plan GitHub Pro ou supérieur pour utiliser GitHub Pages.

## Options de déploiement

### Option A : GitHub Pages (Recommandée)
- Le workflow `deploy.yml` déploie automatiquement sur GitHub Pages
- Votre site sera disponible sur : `https://votre-username.github.io/nom-du-repo`
- **Domaine personnalisé** : Ajoutez un fichier `CNAME` dans le dossier `public/` avec votre domaine

### Option B : Téléchargement manuel
1. Chaque build crée un artifact `production-build`
2. Téléchargez-le depuis l'onglet **Actions** de votre repo
3. Décompressez et uploadez le contenu sur votre serveur

### Option C : Déploiement sur d'autres plateformes
- **Netlify** : Connectez votre repo GitHub, Netlify détectera automatiquement Vite
- **Vercel** : Import depuis GitHub avec détection automatique
- **Firebase Hosting** : Utilisez les artifacts ou ajoutez un step Firebase au workflow

## Étapes suivantes

1. **Activez GitHub Pages** avec la source "GitHub Actions" dans Settings > Pages
2. **Ajoutez vos secrets** Supabase dans les paramètres du repository
3. **Poussez ces modifications** vers la branche main
4. Le déploiement se lancera automatiquement

Si vous continuez à avoir des erreurs, vérifiez que :
- Votre repository est public OU vous avez un plan GitHub Pro/Team
- GitHub Pages est bien activé dans les paramètres
- La source est configurée sur "GitHub Actions"

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

## Ajouter un domaine personnalisé

Pour utiliser votre propre domaine :
1. Créez un fichier `public/CNAME` avec votre domaine (ex: `monapp.mondomaine.com`)
2. Configurez les DNS de votre domaine pour pointer vers GitHub Pages
3. Le déploiement utilisera automatiquement votre domaine
