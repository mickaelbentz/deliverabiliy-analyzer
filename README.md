# Email Deliverability Checker

Un analyseur complet pour vérifier la qualité et la déliverabilité de vos emails HTML.

Basé sur les bonnes pratiques de **[Batch.com](https://doc.batch.com)** et **[Badsender.com](https://www.badsender.com)**.

## Démo

**[Essayer l'application](https://mickaelbentz.github.io/deliverabiliy-analyzer/)**

## Fonctionnalités

### Analyse complète sur 6 catégories

1. **Structure HTML** (8 critères)
   - DOCTYPE HTML5
   - Utilisation de tableaux (standard emails)
   - CSS inline vs CSS externe
   - Largeur optimale (600-650px)
   - Pre-header présent
   - Pas d'images Base64 embarquées
   - Balise title

2. **Contenu** (7 critères)
   - Longueur du texte suffisante
   - Ratio texte/HTML optimal
   - Détection de 30+ mots à risque spam
   - Utilisation excessive de majuscules
   - Points d'exclamation
   - Email lisible sans images activées
   - Adresse physique dans le footer (obligation légale)

3. **Images et Médias** (4 critères)
   - Attributs alt sur TOUTES les images (y compris décoratives)
   - Dimensions spécifiées (width/height)
   - Nombre d'images approprié
   - Images hébergées en ligne (pas Base64, pas locales)

4. **Liens et CTA** (5 critères)
   - Protocole HTTPS sur tous les liens
   - Nombre de liens optimal (<30)
   - Lien de désinscription OBLIGATOIRE (RGPD/CAN-SPAM)
   - Texte descriptif des liens (éviter "cliquez ici")
   - List-Unsubscribe header (one-click unsubscribe)

5. **Performance** (5 critères)
   - Poids HTML < 102KB (limite Gmail - clipping)
   - Poids total < 500KB (éco-conception)
   - Nombre de requêtes externes limité
   - Absence de JavaScript (bloqué par clients mail)
   - Absence de formulaires (non supportés)

6. **Conformité Légale** (5 critères)
   - Lien de désinscription visible
   - Adresse postale physique (CAN-SPAM Act)
   - Pre-header optimisé pour aperçu inbox
   - Identification claire de l'expéditeur
   - Optimisation mobile/responsive

### Système de notation

- **Score global sur 100** avec indicateur visuel circulaire
- **34 critères analysés** au total
- **Recommandations prioritaires** classées par importance (High/Medium/Low)
- **Explications détaillées** pour chaque vérification basées sur Batch.com et Badsender.com

## Utilisation

1. Ouvrez l'application
2. Glissez-déposez votre fichier HTML d'email ou cliquez pour parcourir
3. Cliquez sur "Analyser"
4. Consultez votre score et les recommandations

## Technologies

- **HTML5** - Structure
- **CSS3** - Design moderne et responsive
- **JavaScript Vanilla** - Analyse côté client (aucune donnée envoyée à un serveur)

## Confidentialité

L'application fonctionne **100% côté client**. Vos emails ne sont jamais envoyés à un serveur externe. Toute l'analyse se fait localement dans votre navigateur.

## Installation locale

```bash
git clone https://github.com/mickaelbentz/deliverabiliy-analyzer.git
cd deliverabiliy-analyzer
open index.html
```

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
