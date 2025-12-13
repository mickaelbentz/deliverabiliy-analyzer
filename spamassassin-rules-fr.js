/**
 * Dictionnaire de traduction des règles SpamAssassin
 * Convertit les règles techniques en messages clairs et actionnables
 */

const SPAMASSASSIN_RULES_FR = {
    // Format et Structure
    'MIME_HTML_ONLY': {
        title: 'Email HTML uniquement',
        description: 'Votre email ne contient qu\'une version HTML, sans version texte brut.',
        solution: 'Configurez votre client email pour envoyer en format "multipart/alternative" avec une version texte ET HTML. La plupart des outils d\'emailing (Mailchimp, Sendinblue, etc.) le font automatiquement.',
        priority: 'medium'
    },

    'MISSING_MID': {
        title: 'En-tête Message-ID manquant',
        description: 'L\'email ne contient pas d\'identifiant unique (Message-ID).',
        solution: 'Si vous utilisez un outil d\'emailing professionnel, contactez le support - ils doivent ajouter automatiquement ce header. Pour les développeurs : ajoutez un header Message-ID avec un UUID unique.',
        priority: 'low'
    },

    'MISSING_DATE': {
        title: 'En-tête Date manquant',
        description: 'L\'email ne contient pas de date d\'envoi.',
        solution: 'Vérifiez que votre serveur SMTP ou outil d\'emailing ajoute bien le header "Date". C\'est normalement automatique.',
        priority: 'medium'
    },

    'MISSING_FROM': {
        title: 'Expéditeur manquant',
        description: 'Le champ "From" (expéditeur) est absent ou invalide.',
        solution: 'Vérifiez la configuration de votre expéditeur. Format attendu : "Prénom Nom" &lt;email@domaine.com&gt;',
        priority: 'high'
    },

    'MISSING_SUBJECT': {
        title: 'Sujet manquant',
        description: 'L\'email n\'a pas de sujet.',
        solution: 'Ajoutez un sujet clair et descriptif. Évitez les sujets vides - c\'est un signal de spam majeur.',
        priority: 'high'
    },

    // Contenu et Texte
    'SUBJ_ALL_CAPS': {
        title: 'Sujet en majuscules',
        description: 'Le sujet est entièrement en MAJUSCULES, typique des spams.',
        solution: 'Réécrivez le sujet en casse normale. Exemple : "Offre du mois" au lieu de "OFFRE DU MOIS". Vous pouvez mettre une majuscule au début de chaque mot important, mais pas tout en CAPS.',
        priority: 'high'
    },

    'MANY_EXCLAMATIONS': {
        title: 'Trop de points d\'exclamation',
        description: 'Le sujet ou le contenu contient des points d\'exclamation multiples (!!!).',
        solution: 'Un seul suffit ! Trop de "!!!" ressemble à du spam agressif. Restez sobre dans la ponctuation.',
        priority: 'medium'
    },

    'UPPERCASE_50_75': {
        title: 'Beaucoup de majuscules (50-75%)',
        description: 'Plus de la moitié du texte est en MAJUSCULES.',
        solution: 'Utilisez les majuscules avec modération, uniquement pour les titres.',
        priority: 'high'
    },

    'UPPERCASE_75_100': {
        title: 'Trop de majuscules (>75%)',
        description: 'La quasi-totalité du texte est en MAJUSCULES.',
        solution: 'Réécrivez votre email en casse normale.',
        priority: 'high'
    },

    // Mots et Expressions Spam
    'MONEY_WORD': {
        title: 'Mots liés à l\'argent',
        description: 'Le contenu utilise des mots typiques des arnaques financières.',
        solution: 'Modérez l\'usage de "GRATUIT", "ARGENT", "CASH", "GAGNER" surtout dans le sujet. Si votre offre est légitime, utilisez un ton professionnel plutôt que sensationnaliste.',
        priority: 'high'
    },

    'URGENT_WORD': {
        title: 'Fausse urgence',
        description: 'Utilisation de mots créant une pression temporelle artificielle.',
        solution: 'Évitez "URGENT", "AGISSEZ MAINTENANT", "OFFRE LIMITÉE" en majuscules. Si vous avez une vraie deadline, mentionnez-la calmement : "Offre valable jusqu\'au 15 mars".',
        priority: 'medium'
    },

    'CLICK_HERE': {
        title: 'Lien générique "Cliquez ici"',
        description: 'Les liens "Cliquez ici" ou "Click here" sont typiques du spam.',
        solution: 'Rendez vos liens descriptifs. Mauvais : "Cliquez ici". Bon : "Découvrir nos produits" ou "Télécharger le guide".',
        priority: 'medium'
    },

    // Liens et URLs
    'HTTP_ESCAPED_HOST': {
        title: 'URL encodée suspecte',
        description: 'L\'URL contient des caractères encodés de manière suspecte.',
        solution: 'Utilisez des URLs propres et lisibles sans encodage excessif.',
        priority: 'medium'
    },

    'BAYES_99': {
        title: 'Contenu identifié comme spam',
        description: 'Le filtre anti-spam a analysé des millions d\'emails et identifie le vôtre comme spam à 99%.',
        solution: 'Votre email ressemble trop à des spams connus. Réécrivez-le complètement : changez le vocabulaire, le ton, la structure. Inspirez-vous d\'emails de marques connues.',
        priority: 'high'
    },

    'BAYES_95': {
        title: 'Contenu très suspect',
        description: 'Le filtre anti-spam classe votre email comme spam probable (95%).',
        solution: 'Problème majeur de contenu. Évitez les mots spam, le sensationnalisme, les promesses irréalistes. Adoptez un ton professionnel et factuel.',
        priority: 'high'
    },

    'BAYES_50': {
        title: 'Contenu ambigu',
        description: 'Le filtre hésite : 50% spam, 50% légitime.',
        solution: 'Clarifiez votre message. Ajoutez du contexte, personnalisez, signez avec vos vraies coordonnées. Montrez que vous êtes une vraie entreprise.',
        priority: 'low'
    },

    // SPF, DKIM, DMARC
    'SPF_PASS': {
        title: 'SPF validé',
        description: 'Votre serveur d\'envoi est autorisé (SPF pass).',
        solution: 'Aucune action requise - c\'est un bon point !',
        priority: 'positive'
    },

    'SPF_FAIL': {
        title: 'Échec SPF',
        description: 'Votre serveur d\'envoi n\'est pas autorisé à envoyer pour ce domaine.',
        solution: 'Configurez correctement votre enregistrement SPF dans le DNS de votre domaine.',
        priority: 'high'
    },

    'DKIM_VALID': {
        title: 'DKIM validé',
        description: 'Votre email est correctement signé avec DKIM.',
        solution: 'Aucune action requise - c\'est un bon point !',
        priority: 'positive'
    },

    'DKIM_INVALID': {
        title: 'Signature DKIM invalide',
        description: 'La signature DKIM est présente mais invalide.',
        solution: 'Vérifiez la configuration DKIM de votre serveur d\'envoi.',
        priority: 'high'
    },

    'DMARC_PASS': {
        title: 'DMARC validé',
        description: 'Votre email passe les vérifications DMARC.',
        solution: 'Aucune action requise - c\'est un bon point !',
        priority: 'positive'
    },

    // HTML et Images
    'HTML_IMAGE_ONLY': {
        title: 'Email = une seule image',
        description: 'Votre email est juste une grande image, sans texte HTML.',
        solution: 'Grave erreur ! Beaucoup de clients bloquent les images par défaut. Ajoutez du vrai texte HTML. Si vous devez absolument utiliser une image, ajoutez au minimum un titre, un résumé et un CTA en texte.',
        priority: 'high'
    },

    'HTML_IMAGE_RATIO_02': {
        title: 'Trop d\'images, pas assez de texte',
        description: 'Le ratio images/texte est déséquilibré.',
        solution: 'Règle d\'or : au moins 60% de texte, maximum 40% d\'images. Ajoutez des descriptions, du contexte, des explications en texte HTML.',
        priority: 'medium'
    },

    'EMPTY_MESSAGE': {
        title: 'Email vide',
        description: 'L\'email ne contient aucun contenu.',
        solution: 'Ajoutez du contenu à votre email !',
        priority: 'high'
    },

    // Encodage et Caractères
    'CHARSET_FARAWAY': {
        title: 'Encodage de caractères inhabituel',
        description: 'Utilisation d\'un charset inhabituel pour votre langue.',
        solution: 'Utilisez UTF-8 pour les emails en français/anglais.',
        priority: 'low'
    },

    // Blacklists et Réputation
    'RCVD_IN_XBL': {
        title: 'IP dans une blacklist (XBL)',
        description: 'L\'IP d\'envoi est listée dans une blacklist de spam.',
        solution: 'Contactez votre fournisseur d\'envoi d\'emails ou demandez le retrait de la blacklist.',
        priority: 'high'
    },

    'RCVD_IN_PBL': {
        title: 'IP dynamique détectée (PBL)',
        description: 'L\'IP d\'envoi semble être une IP dynamique/résidentielle.',
        solution: 'Utilisez un serveur SMTP professionnel avec IP fixe pour envoyer vos emails.',
        priority: 'high'
    },

    // Règles génériques
    'FREEMAIL_FROM': {
        title: 'Email gratuit détecté',
        description: 'L\'expéditeur utilise une adresse email gratuite (Gmail, Yahoo, etc.).',
        solution: 'Pour des envois professionnels, utilisez votre propre domaine.',
        priority: 'low'
    },

    'NO_RECEIVED': {
        title: 'Headers de routage manquants',
        description: 'L\'email n\'a pas de headers "Received" indiquant son parcours.',
        solution: 'Assurez-vous que votre client email ajoute correctement les headers.',
        priority: 'medium'
    }
};

/**
 * Obtenir la traduction d'une règle SpamAssassin
 * @param {string} ruleName - Nom de la règle (ex: "MIME_HTML_ONLY")
 * @param {string} originalDescription - Description originale de l'API
 * @returns {object} - Traduction avec title, description, solution
 */
function getSpamAssassinRuleTranslation(ruleName, originalDescription) {
    // Recherche exacte
    if (SPAMASSASSIN_RULES_FR[ruleName]) {
        return SPAMASSASSIN_RULES_FR[ruleName];
    }

    // Recherche partielle (pour les variantes)
    for (const [key, value] of Object.entries(SPAMASSASSIN_RULES_FR)) {
        if (ruleName.includes(key) || key.includes(ruleName)) {
            return value;
        }
    }

    // Fallback : essayer de rendre lisible la description originale
    let description = originalDescription || ruleName;

    // Patterns courants à traduire
    const patterns = [
        { regex: /BODY:/i, replacement: 'Contenu :' },
        { regex: /SUBJECT:/i, replacement: 'Sujet :' },
        { regex: /Message only has text\/html MIME parts/i, replacement: 'Email HTML uniquement (pas de version texte)' },
        { regex: /Missing .* header/i, replacement: 'En-tête manquant' },
        { regex: /ADMINISTRATOR NOTICE:/i, replacement: 'Note serveur :' }
    ];

    patterns.forEach(({ regex, replacement }) => {
        description = description.replace(regex, replacement);
    });

    return {
        title: ruleName,
        description: description,
        solution: 'Consultez la documentation SpamAssassin pour plus de détails sur cette règle.',
        priority: 'medium',
        untranslated: true
    };
}

// Export pour utilisation dans le navigateur et Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SPAMASSASSIN_RULES_FR, getSpamAssassinRuleTranslation };
}

if (typeof window !== 'undefined') {
    window.SPAMASSASSIN_RULES_FR = SPAMASSASSIN_RULES_FR;
    window.getSpamAssassinRuleTranslation = getSpamAssassinRuleTranslation;
}
