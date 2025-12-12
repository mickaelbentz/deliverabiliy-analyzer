# Intégration SpamAssassin - Documentation

## 🎯 Vue d'ensemble

Cette intégration ajoute une analyse anti-spam complète basée sur **SpamAssassin** (le moteur #1 open source) via l'API Postmark SpamCheck.

## 📁 Fichiers modifiés/créés

### Nouveaux fichiers

1. **`api/spamcheck.js`** - Serverless function Vercel
   - Fait office de proxy vers l'API Postmark
   - Gère les CORS
   - Valide les requêtes
   - Timeout: 30 secondes max

2. **`vercel.json`** - Configuration Vercel
   - Définit les routes API
   - Configure les headers CORS
   - Paramètre la mémoire et durée max

3. **`package.json`** - Gestion des dépendances
   - Scripts npm pour dev et déploiement
   - Dépendance Vercel CLI

4. **`.gitignore`** - Fichiers ignorés
   - Dossiers Vercel
   - node_modules
   - Variables d'environnement

### Fichiers modifiés

1. **`script.js`**
   - Ajout de `constructRawEmail()` - ligne 185
   - Ajout de `analyzeSpamScore()` - ligne 193
   - `analyzeEmail()` devient asynchrone - ligne 299
   - `analyzeBtn` event listener modifié (async/await) - ligne 162
   - `displayResults()` inclut maintenant SpamAssassin - ligne 1099

2. **`index.html`**
   - Nouvelle section `#spam-category` - ligne 90
   - Indicateur de chargement `#spam-loading` - ligne 95

3. **`style.css`**
   - Animation `@keyframes spin` pour loading - ligne 590

4. **`README.md`**
   - Section Architecture ajoutée
   - Instructions de déploiement Vercel
   - Documentation de la 6ème catégorie

## 🔧 Comment ça fonctionne

### 1. Construction de l'email brut

```javascript
function constructRawEmail() {
    // Extrait les métadonnées du HTML
    const title = emailDoc.querySelector('title')?.textContent;
    const metaFrom = emailDoc.querySelector('meta[name="from"]')?.content;
    const metaSubject = emailDoc.querySelector('meta[name="subject"]')?.content;

    // Construit un email RFC 5322 valide avec headers
    const headers = [
        `From: ${metaFrom}`,
        `To: recipient@example.com`,
        `Subject: ${metaSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Date: ${new Date().toUTCString()}`
    ].join('\r\n');

    return `${headers}\r\n\r\n${emailHTML}`;
}
```

### 2. Appel à l'API

```javascript
async function analyzeSpamScore() {
    const rawEmail = constructRawEmail();

    // Détection auto de l'environnement
    const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api/spamcheck'
        : '/api/spamcheck';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: rawEmail,
            options: 'long'
        })
    });

    const result = await response.json();
    // Traitement du score et des règles...
}
```

### 3. Calcul du score sur 100

SpamAssassin retourne un score de 0 à 10+ :
- **< 2** = Excellent (100 points)
- **2-5** = Acceptable (50-100 points, linéaire)
- **> 5** = Spam (0-50 points, linéaire)

### 4. Affichage des règles

Les 5 règles les plus importantes sont affichées avec :
- Nom de la règle (ex: `BAYES_00`, `HTML_MESSAGE`)
- Score associé (+/- points)
- Description (si disponible)

## 🚀 Déploiement

### Développement local

```bash
# Installer les dépendances
npm install

# Lancer Vercel en local (port 3000)
npm run dev
```

L'API sera disponible sur `http://localhost:3000/api/spamcheck`

### Déploiement production

```bash
# Déployer sur Vercel
npm run deploy
```

Ou connecter votre repo GitHub à Vercel pour du déploiement continu.

## 📊 Format de réponse de l'API

### Succès

```json
{
  "success": true,
  "score": 2.3,
  "rules": [
    {
      "rule": "BAYES_00",
      "score": -1.9,
      "description": "Bayes spam probability is 0 to 1%"
    },
    {
      "rule": "HTML_MESSAGE",
      "score": 0.0,
      "description": "HTML included in message"
    }
  ],
  "report": "Full SpamAssassin report...",
  "timestamp": "2025-12-12T10:30:00.000Z",
  "provider": "Postmark SpamCheck (SpamAssassin)"
}
```

### Erreur

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

## ⚠️ Gestion des erreurs

L'application gère gracieusement les erreurs :

1. **API indisponible** : Affiche un message d'erreur dans l'UI
2. **Timeout** : Limite à 30 secondes
3. **Email trop gros** : Limite à 1MB
4. **Score ignoré** : Si erreur, le score global est calculé sur 5 catégories au lieu de 6

## 🔒 Sécurité et confidentialité

- ✅ **CORS** configuré pour sécurité
- ✅ **Validation** des inputs côté backend
- ✅ **Limite de taille** : 1MB max par email
- ✅ **Timeout** : 30 secondes max
- ⚠️ **Données externes** : L'email est envoyé à Postmark pour analyse
- ✅ **Pas de stockage** : Aucun email n'est stocké

## 📈 Métriques et limites

### API Postmark SpamCheck

- **Gratuit** : Oui
- **Rate limit** : Non documenté (usage raisonnable)
- **Temps de réponse** : 2-8 secondes en moyenne
- **Disponibilité** : Peut être modifié/supprimé par Postmark

### Vercel Serverless Functions

- **Plan gratuit** : 100GB-heures/mois
- **Timeout** : 30 secondes configuré
- **Mémoire** : 1024MB configurée
- **Invocations** : Illimitées (usage raisonnable)

## 🧪 Tests

### Test manuel

1. Lancer l'app : `npm run dev`
2. Charger un email HTML de test
3. Cliquer sur "Analyser"
4. Vérifier :
   - ⏳ Indicateur de chargement apparaît
   - 🎯 Score SpamAssassin s'affiche
   - 📋 Règles détaillées visibles
   - ✅ Score global inclut SpamAssassin

### Test de l'API directement

```bash
curl -X POST http://localhost:3000/api/spamcheck \
  -H "Content-Type: application/json" \
  -d '{
    "email": "From: test@example.com\r\nTo: user@example.com\r\nSubject: Test\r\n\r\n<html><body>Hello World</body></html>",
    "options": "long"
  }'
```

## 🐛 Dépannage

### L'analyse SpamAssassin ne fonctionne pas

1. **Vérifier la console** : Ouvrir DevTools → Console
2. **Vérifier l'URL de l'API** : Doit pointer vers `/api/spamcheck`
3. **Vérifier Vercel** : `vercel dev` doit être lancé
4. **Tester l'API** : Utiliser curl (voir ci-dessus)

### Erreur CORS

- Vérifier `vercel.json` : Headers CORS correctement configurés
- Redémarrer `vercel dev`

### Timeout

- L'API Postmark peut prendre 5-10 secondes
- Le timeout est configuré à 30 secondes
- Vérifier la taille de l'email (< 1MB)

## 🚧 Améliorations futures possibles

1. **Cache** : Mettre en cache les résultats pour éviter les appels répétés
2. **Mode offline** : Détecter si l'API est indisponible et désactiver l'analyse
3. **Alternative** : Ajouter une option pour utiliser d'autres APIs (Mail Tester, etc.)
4. **Backend propre** : Installer SpamAssassin localement au lieu de Postmark
5. **Metrics** : Logger les analyses pour stats

## 📚 Ressources

- [SpamAssassin Official](https://spamassassin.apache.org/)
- [Postmark SpamCheck API](https://spamcheck.postmarkapp.com/doc/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [RFC 5322 - Email format](https://tools.ietf.org/html/rfc5322)

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Tester localement avec `npm run dev`
- [ ] Vérifier que tous les fichiers sont commités
- [ ] Tester avec plusieurs emails (HTML simple, EML, gros fichiers)
- [ ] Vérifier le .gitignore
- [ ] Déployer sur Vercel : `npm run deploy`
- [ ] Tester en production
- [ ] Mettre à jour le lien de démo dans le README

## 📞 Support

En cas de problème :
1. Vérifier cette documentation
2. Consulter les logs Vercel : https://vercel.com/dashboard
3. Tester l'API Postmark directement
4. Ouvrir une issue GitHub
