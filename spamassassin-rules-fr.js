/**
 * Dictionnaire de traduction des règles SpamAssassin
 * Convertit les règles techniques en messages clairs et actionnables
 */

const SPAMASSASSIN_RULES_FR = {
    // Format et Structure
    'MIME_HTML_ONLY': {
        title: 'Email HTML uniquement',
        description: 'Votre email ne contient qu\'une version HTML. Ajoutez une version texte brut pour améliorer la déliverabilité.',
        solution: 'Ajoutez un contenu texte alternatif (<noscript> ou multipart/alternative) pour les clients qui bloquent le HTML.',
        priority: 'medium'
    },

    'MISSING_MID': {
        title: 'En-tête Message-ID manquant',
        description: 'L\'email ne contient pas d\'identifiant unique (Message-ID).',
        solution: 'Ajoutez un header Message-ID : <unique-id@votre-domaine.com>. Votre client email devrait le faire automatiquement.',
        priority: 'low'
    },

    'MISSING_DATE': {
        title: 'En-tête Date manquant',
        description: 'L\'email ne contient pas de date d\'envoi.',
        solution: 'Ajoutez un header Date avec la date d\'envoi au format RFC 2822.',
        priority: 'medium'
    },

    'MISSING_FROM': {
        title: 'Expéditeur manquant',
        description: 'Le champ "From" (expéditeur) est absent ou invalide.',
        solution: 'Ajoutez un header From valide : From: Nom <email@domaine.com>',
        priority: 'high'
    },

    'MISSING_SUBJECT': {
        title: 'Sujet manquant',
        description: 'L\'email n\'a pas de sujet.',
        solution: 'Ajoutez un sujet clair et descriptif à votre email.',
        priority: 'high'
    },

    // Contenu et Texte
    'SUBJ_ALL_CAPS': {
        title: 'Sujet en majuscules',
        description: 'Le sujet est entièrement en MAJUSCULES, ce qui ressemble à du spam.',
        solution: 'Utilisez une casse normale : "Newsletter Mensuelle" au lieu de "NEWSLETTER MENSUELLE".',
        priority: 'high'
    },

    'MANY_EXCLAMATIONS': {
        title: 'Trop de points d\'exclamation',
        description: 'Le sujet ou le contenu contient trop de points d\'exclamation (!!!).',
        solution: 'Limitez-vous à un seul point d\'exclamation maximum.',
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
        description: 'Le contenu contient des mots souvent utilisés dans les spams (FREE, MONEY, CASH, etc.).',
        solution: 'Évitez les mots "FREE", "$$$", "CASH", "MONEY", "WIN" dans les sujets et contenus promotionnels.',
        priority: 'high'
    },

    'URGENT_WORD': {
        title: 'Mots d\'urgence',
        description: 'Utilisation de mots créant une fausse urgence (URGENT, ACT NOW, LIMITED TIME).',
        solution: 'Évitez les tactiques de pression temporelle agressives.',
        priority: 'medium'
    },

    'CLICK_HERE': {
        title: 'Texte "Cliquez ici"',
        description: 'Utilisation de textes de lien génériques comme "Cliquez ici" ou "Click here".',
        solution: 'Utilisez des textes de lien descriptifs : "Voir l\'offre" au lieu de "Cliquez ici".',
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
        title: 'Contenu très suspect (Bayésien)',
        description: 'Le filtre bayésien détecte un contenu très similaire à du spam connu (99% de probabilité).',
        solution: 'Revoyez complètement le contenu de votre email. Il ressemble fortement à du spam.',
        priority: 'high'
    },

    'BAYES_95': {
        title: 'Contenu suspect (Bayésien)',
        description: 'Le filtre bayésien détecte un contenu similaire à du spam (95% de probabilité).',
        solution: 'Modifiez le ton et le vocabulaire de votre email.',
        priority: 'high'
    },

    'BAYES_50': {
        title: 'Contenu potentiellement suspect',
        description: 'Le filtre bayésien n\'est pas sûr si c\'est du spam ou non (50/50).',
        solution: 'Améliorez la qualité et la clarté de votre contenu.',
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
        title: 'Email composé uniquement d\'images',
        description: 'Votre email ne contient que des images, sans texte HTML.',
        solution: 'Ajoutez du texte HTML visible. Un email 100% image est souvent bloqué.',
        priority: 'high'
    },

    'HTML_IMAGE_RATIO_02': {
        title: 'Trop d\'images par rapport au texte',
        description: 'Le ratio images/texte est déséquilibré (trop d\'images).',
        solution: 'Ajoutez plus de contenu texte ou réduisez le nombre/taille des images.',
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
