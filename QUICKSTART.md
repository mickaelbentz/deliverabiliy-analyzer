# 🚀 Guide de Démarrage Rapide

## Installation et test en 5 minutes

### Prérequis

- Node.js 18+ installé
- Un terminal

### Étape 1 : Installation

```bash
# Cloner le repo (ou utiliser votre clone existant)
cd vigorous-cray

# Installer les dépendances
npm install
```

### Étape 2 : Lancer en développement local

```bash
# Démarrer le serveur Vercel local
npm run dev
```

Le serveur démarre sur **http://localhost:3000**

Vous devriez voir :
```
Vercel CLI 33.x.x
> Ready! Available at http://localhost:3000
```

### Étape 3 : Tester l'application

1. **Ouvrir votre navigateur** : http://localhost:3000

2. **Charger un email de test** :
   - Glissez-déposez le fichier `test-email.html` fourni
   - Ou cliquez sur "Importez un email"

3. **Lancer l'analyse** :
   - Cliquez sur "Lancez l'analyse"
   - Attendez 5-10 secondes (analyse SpamAssassin)
   - ⏳ Un indicateur de chargement apparaît

4. **Consulter les résultats** :
   - Score global sur 100
   - 6 catégories d'analyse
   - Section "Score Anti-spam (SpamAssassin)" avec :
     - Score de 0 à 10
     - 5 règles principales déclenchées
   - Recommandations prioritaires

### Étape 4 : Tester l'API directement (optionnel)

```bash
# Dans un autre terminal
curl -X POST http://localhost:3000/api/spamcheck \
  -H "Content-Type: application/json" \
  -d '{
    "email": "From: test@example.com\r\nTo: user@example.com\r\nSubject: Test Email\r\n\r\n<html><body><h1>Hello World</h1><p>This is a test email with enough content to pass spam filters. We are testing the integration of SpamAssassin with our email deliverability checker.</p></body></html>",
    "options": "long"
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "score": 2.1,
  "rules": [...],
  "report": "...",
  "timestamp": "2025-12-12T...",
  "provider": "Postmark SpamCheck (SpamAssassin)"
}
```

## 🐛 Dépannage

### Problème : "Port 3000 already in use"

```bash
# Trouver et tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
vercel dev --listen 3001
```

### Problème : "Cannot find module 'vercel'"

```bash
# Réinstaller les dépendances
npm install

# Ou installer Vercel CLI globalement
npm install -g vercel
```

### Problème : "SpamAssassin check failed"

1. Vérifier que `vercel dev` est bien lancé
2. Ouvrir la console du navigateur (F12) pour voir l'erreur
3. Vérifier la connectivité internet (appel API externe)
4. Tester l'API Postmark directement :

```bash
curl -X POST https://spamcheck.postmarkapp.com/filter \
  -H "Content-Type: application/json" \
  -d '{"email": "From: test@test.com\r\n\r\nHello", "options": "long"}'
```

### Problème : "CORS error"

Si vous ouvrez `index.html` directement sans Vercel :
- ❌ Ne fonctionne pas : `file:///path/to/index.html`
- ✅ Fonctionne : `http://localhost:3000`

**Solution** : Toujours utiliser `npm run dev`

## 🚀 Déploiement sur Vercel

### Méthode 1 : Via CLI

```bash
# Se connecter à Vercel (première fois)
npx vercel login

# Déployer
npm run deploy

# Suivre les instructions
# Sélectionner le scope (votre compte)
# Confirmer les paramètres
```

Votre app sera déployée sur : `https://votre-projet.vercel.app`

### Méthode 2 : Via GitHub (Recommandé)

1. **Push sur GitHub** :
```bash
git push origin vigorous-cray
```

2. **Connecter à Vercel** :
   - Aller sur https://vercel.com/new
   - Sélectionner votre repo GitHub
   - Importer le projet
   - Laisser les paramètres par défaut
   - Deploy!

3. **Déploiement automatique** :
   - À chaque push, Vercel redéploie automatiquement
   - Preview deployments pour les branches

## 📊 Structure des fichiers

```
vigorous-cray/
├── api/
│   └── spamcheck.js          # Serverless function
├── index.html                 # Frontend
├── script.js                  # Logique d'analyse
├── style.css                  # Styles
├── vercel.json                # Config Vercel
├── package.json               # Dépendances
├── test-email.html            # Email de test
├── README.md                  # Documentation principale
├── INTEGRATION_SPAMASSASSIN.md # Doc technique
└── QUICKSTART.md              # Ce fichier
```

## ✅ Checklist de vérification

Après installation, vérifier :

- [ ] `npm run dev` démarre sans erreur
- [ ] http://localhost:3000 affiche l'application
- [ ] Le drag & drop fonctionne
- [ ] L'analyse se lance
- [ ] L'indicateur de chargement apparaît
- [ ] Le score SpamAssassin s'affiche (après 5-10 sec)
- [ ] Les 5 règles SpamAssassin sont visibles
- [ ] Le PDF s'exporte correctement

## 📚 Prochaines étapes

1. **Personnaliser** : Modifier les couleurs dans `style.css`
2. **Tester** : Essayer avec vos propres emails HTML
3. **Déployer** : Suivre les étapes de déploiement Vercel
4. **Monitorer** : Consulter les logs sur https://vercel.com/dashboard

## 💡 Astuces

- **Développement rapide** : Utilisez le live reload de Vercel
- **Debug API** : Consultez les logs dans le terminal où tourne `vercel dev`
- **Test emails** : Utilisez https://html.onlineemailbuilder.com/ pour créer des tests
- **Export EML** : Testez avec des vrais emails exportés depuis Gmail/Outlook

## 🆘 Besoin d'aide ?

1. Consulter `INTEGRATION_SPAMASSASSIN.md` pour la doc technique
2. Consulter `README.md` pour la doc complète
3. Ouvrir une issue GitHub si problème persistant

Bon développement ! 🎉
