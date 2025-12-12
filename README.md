# Email Deliverability Checker

Un analyseur complet pour vérifier la qualité et la déliverabilité de vos emails HTML.

Basé sur les bonnes pratiques de **[Batch.com](https://doc.batch.com)** et **[Badsender.com](https://www.badsender.com)**.

## Démo

**[Essayer l'application](https://mickaelbentz.github.io/deliverabiliy-analyzer/)**

## Fonctionnalités

### Analyse complète sur 6 catégories

1. **Contenu** (7 critères)
   - Longueur du texte suffisante
   - Ratio texte/HTML optimal
   - Détection de 30+ mots à risque spam
   - Utilisation excessive de majuscules
   - Points d'exclamation
   - Email lisible sans images activées
   - Adresse physique dans le footer (obligation légale)

2. **Images et Médias** (4 critères)
   - Attributs alt sur TOUTES les images (y compris décoratives)
   - Dimensions spécifiées (width/height)
   - Nombre d'images approprié
   - Images hébergées en ligne (pas Base64, pas locales)

3. **Liens et CTA** (5 critères)
   - Protocole HTTPS sur tous les liens
   - Nombre de liens optimal (<30)
   - Lien de désinscription OBLIGATOIRE (RGPD/CAN-SPAM)
   - Texte descriptif des liens (éviter "cliquez ici")
   - List-Unsubscribe header (one-click unsubscribe)

4. **Performance** (5 critères)
   - Poids HTML < 102KB (limite Gmail - clipping)
   - Poids total < 500KB (éco-conception)
   - Nombre de requêtes externes limité
   - Absence de JavaScript (bloqué par clients mail)
   - Absence de formulaires (non supportés)

5. **Conformité Légale** (5 critères)
   - Lien de désinscription visible
   - Adresse postale physique (CAN-SPAM Act)
   - Pre-header optimisé pour aperçu inbox
   - Identification claire de l'expéditeur
   - Optimisation mobile/responsive

6. **Score Anti-spam (SpamAssassin)** 🆕
   - **Analyse complète avec SpamAssassin** - Le moteur anti-spam open source #1
   - Score de 0 à 10 (< 5 = délivrable, > 5 = risque spam)
   - Détection de centaines de règles anti-spam
   - Affichage des 5 règles principales déclenchées
   - Powered by Postmark SpamCheck API

### Système de notation

- **Score global sur 100** avec indicateur visuel circulaire
- **34 critères analysés** au total
- **Recommandations prioritaires** classées par importance (High/Medium/Low)
- **Explications détaillées** pour chaque vérification basées sur Batch.com et Badsender.com

## Utilisation

1. Ouvrez l'application
2. Glissez-déposez votre fichier **HTML** ou **EML** d'email (ou cliquez pour parcourir)
3. Cliquez sur "Analyser"
4. Consultez votre score et les recommandations

### Formats supportés
- **`.html` / `.htm`** - Fichiers HTML d'emails
- **`.eml`** - Fichiers emails complets (exportés depuis clients mail)

L'application extrait automatiquement le contenu HTML des fichiers EML et gère les encodages Base64 et Quoted-Printable.

## Technologies

- **HTML5** - Structure
- **CSS3** - Design moderne et responsive
- **JavaScript Vanilla** - Analyse côté client
- **Vercel Serverless Functions** - Backend léger pour SpamAssassin
- **SpamAssassin** - Via Postmark API

## Architecture

L'application utilise une architecture hybride :

- **Frontend** : 100% client-side (HTML/CSS/JS vanilla)
- **Backend** : Vercel Serverless Function unique (`/api/spamcheck`) qui fait proxy vers l'API Postmark SpamCheck
- **Confidentialité** : Les analyses de base (contenu, images, liens, etc.) se font localement. Seule l'analyse SpamAssassin nécessite un appel API externe.

## Installation et Déploiement

### Développement local

1. **Cloner le repo**
```bash
git clone https://github.com/mickaelbentz/deliverabiliy-analyzer.git
cd deliverabiliy-analyzer
```

2. **Installer Vercel CLI** (pour tester les serverless functions)
```bash
npm install -g vercel
```

3. **Lancer en local**
```bash
vercel dev
```

L'application sera disponible sur `http://localhost:3000`

> **Note :** Sans Vercel, vous pouvez ouvrir `index.html` directement, mais l'analyse SpamAssassin ne fonctionnera pas.

### Déploiement sur Vercel

1. **Créer un compte** sur [vercel.com](https://vercel.com)

2. **Déployer avec la CLI**
```bash
vercel
```

Ou via GitHub :
- Connecter votre repo GitHub à Vercel
- Push sur la branche principale
- Vercel déploie automatiquement

3. **Configuration**
   - Aucune variable d'environnement requise
   - Le fichier `vercel.json` est déjà configuré
   - L'API `/api/spamcheck` sera automatiquement disponible

### Déploiement sur d'autres plateformes

L'application peut aussi être déployée sur :
- **Netlify Functions** (adapter le fichier `api/spamcheck.js`)
- **Cloudflare Workers** (avec modifications)
- **AWS Lambda** (via API Gateway)

## Bonnes pratiques emails

Quelques rappels pour optimiser la déliverabilité :

- ✅ Utilisez des tableaux pour la mise en page
- ✅ CSS inline plutôt qu'externe
- ✅ Ajoutez des attributs alt sur toutes les images
- ✅ Hébergez les images en ligne (pas de pièces jointes)
- ✅ Largeur max 600-650px
- ✅ Incluez toujours un lien de désinscription
- ✅ Ratio texte/HTML > 20%
- ✅ Évitez les mots spam
- ✅ Utilisez HTTPS pour tous les liens
- ✅ Gardez le fichier < 100KB

## Licence

MIT

## Auteur

Mickaël Bentz
