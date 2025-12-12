// Variables globales
let emailHTML = '';
let emailHTMLOriginal = ''; // HTML original AVANT parsing
let emailDoc = null;

// Éléments DOM
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsSection = document.getElementById('results-section');
const resetBtn = document.getElementById('reset-btn');

// Mots spam courants (note: selon Badsender, impact limité mais à surveiller)
const SPAM_WORDS = [
    'gratuit', 'free', 'urgent', 'cliquez ici', 'click here', 'garantie',
    'argent facile', 'gagner', 'prize', 'winner', 'congratulations',
    'act now', 'limited time', 'offre limitée', 'millionaire', 'casino',
    '100%', 'satisfaction garantie', 'risque zéro', 'viagra', 'lottery',
    'act immediately', 'apply now', 'become a member', 'billing', 'billion',
    'cash bonus', 'cheap', 'clearance', 'collect', 'compare rates',
    'credit', 'dear friend', 'discount', 'earn money', 'eliminate debt'
];

// Gestion du drag & drop
uploadArea.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// Gérer le fichier uploadé
function handleFile(file) {
    if (!file) return;

    const isHTML = file.name.endsWith('.html') || file.name.endsWith('.htm');
    const isEML = file.name.endsWith('.eml');

    if (!isHTML && !isEML) {
        alert('Veuillez sélectionner un fichier HTML ou EML');
        return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;

        if (isEML) {
            // Parser le fichier EML pour extraire le HTML
            emailHTML = extractHTMLFromEML(content);
            if (!emailHTML) {
                alert('Impossible d\'extraire le contenu HTML de ce fichier EML');
                fileInfo.style.display = 'none';
                return;
            }
        } else {
            emailHTML = content;
        }

        // IMPORTANT : Sauvegarder l'HTML ORIGINAL avant parsing
        emailHTMLOriginal = emailHTML;

        const parser = new DOMParser();
        emailDoc = parser.parseFromString(emailHTML, 'text/html');
    };
    reader.readAsText(file);
}

// Extraire le HTML d'un fichier EML
function extractHTMLFromEML(emlContent) {
    // Les fichiers EML sont au format MIME
    // Chercher la partie HTML (Content-Type: text/html)

    // Méthode 1: Chercher entre les boundary pour multipart
    const boundaryMatch = emlContent.match(/boundary="?([^"\s]+)"?/i);

    if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = emlContent.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));

        // Chercher la partie HTML
        for (let part of parts) {
            if (part.includes('Content-Type: text/html') || part.includes('Content-Type:text/html')) {
                // Extraire le contenu après les headers
                const htmlMatch = part.split(/\r?\n\r?\n/).slice(1).join('\n');

                // Décoder si base64
                if (part.includes('Content-Transfer-Encoding: base64')) {
                    try {
                        return atob(htmlMatch.trim());
                    } catch (e) {
                        // Si le décodage échoue, essayer sans
                    }
                }

                // Décoder si quoted-printable
                if (part.includes('Content-Transfer-Encoding: quoted-printable')) {
                    return decodeQuotedPrintable(htmlMatch);
                }

                return htmlMatch.trim();
            }
        }
    }

    // Méthode 2: Simple extraction si pas de multipart
    // Chercher directement du HTML dans le contenu
    const htmlRegex = /<!DOCTYPE html[\s\S]*?<\/html>/i;
    const htmlMatch = emlContent.match(htmlRegex);
    if (htmlMatch) {
        return htmlMatch[0];
    }

    // Méthode 3: Chercher des balises HTML basiques
    const simpleHtmlRegex = /<html[\s\S]*?<\/html>/i;
    const simpleMatch = emlContent.match(simpleHtmlRegex);
    if (simpleMatch) {
        return simpleMatch[0];
    }

    return null;
}

// Décoder le quoted-printable
function decodeQuotedPrintable(str) {
    return str
        .replace(/=\r?\n/g, '') // Supprimer les soft line breaks
        .replace(/=([0-9A-F]{2})/gi, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
}

// Analyser l'email
analyzeBtn.addEventListener('click', async () => {
    if (!emailHTML || !emailDoc) {
        alert('Veuillez d\'abord charger un fichier HTML');
        return;
    }

    // Désactiver le bouton pendant l'analyse
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyse en cours...';

    try {
        const results = await analyzeEmail();
        displayResults(results);
    } catch (error) {
        console.error('Error during analysis:', error);
        alert('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.');
    } finally {
        // Réactiver le bouton
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyser l\'email';
    }
});

// Construction d'un email brut avec headers pour SpamAssassin
function constructRawEmail() {
    // Extraire les informations du document
    const title = emailDoc.querySelector('title')?.textContent || 'Email Newsletter';
    const metaFrom = emailDoc.querySelector('meta[name="from"]')?.content || 'sender@example.com';
    const metaSubject = emailDoc.querySelector('meta[name="subject"]')?.content || title;

    // Construire un email RFC 5322 valide
    const headers = [
        `From: ${metaFrom}`,
        `To: recipient@example.com`,
        `Subject: ${metaSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Date: ${new Date().toUTCString()}`
    ].join('\r\n');

    // Combiner headers et body
    return `${headers}\r\n\r\n${emailHTML}`;
}

// Analyse du score SpamAssassin
async function analyzeSpamScore() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    // Construire l'email brut avec headers
    const rawEmail = constructRawEmail();

    try {
        // Appel à notre API backend (Vercel Function)
        // En développement local: http://localhost:3000/api/spamcheck
        // En production: https://votre-domaine.vercel.app/api/spamcheck
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api/spamcheck'
            : '/api/spamcheck';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: rawEmail,
                options: 'long'
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'SpamAssassin check failed');
        }

        // SpamAssassin score: < 5 = bon, > 5 = spam
        const spamScore = parseFloat(result.score);
        const isGood = spamScore < 2;
        const isAcceptable = spamScore >= 2 && spamScore < 5;
        const isBad = spamScore >= 5;

        // Calcul du score sur 100
        if (isGood) {
            score = 100;
        } else if (isAcceptable) {
            // Score linéaire entre 2 et 5: 100 à 50 points
            score = 100 - ((spamScore - 2) / 3) * 50;
        } else {
            // Score linéaire entre 5 et 10: 50 à 0 points
            score = Math.max(0, 50 - ((spamScore - 5) / 5) * 50);
        }

        // Check principal: Score SpamAssassin
        checks.push({
            pass: spamScore < 5,
            title: 'Score SpamAssassin',
            description: spamScore < 2
                ? `${spamScore.toFixed(1)}/10 - Excellent, très faible risque de spam`
                : spamScore < 5
                    ? `${spamScore.toFixed(1)}/10 - Acceptable, risque modéré`
                    : `${spamScore.toFixed(1)}/10 - Attention, fort risque de spam`
        });

        // Ajouter les règles déclenchées les plus importantes
        if (result.rules && result.rules.length > 0) {
            // Trier par score décroissant et prendre les 5 premières
            const topRules = result.rules
                .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
                .slice(0, 5);

            topRules.forEach(rule => {
                checks.push({
                    pass: rule.score < 0, // Score négatif = bon
                    title: rule.rule,
                    description: `${rule.score > 0 ? '+' : ''}${rule.score.toFixed(1)} pts - ${rule.description || 'Règle SpamAssassin'}`
                });
            });
        }

        return {
            score: Math.round(score),
            maxScore,
            checks,
            rawScore: spamScore,
            provider: result.provider
        };

    } catch (error) {
        console.error('SpamAssassin analysis failed:', error);

        // En cas d'erreur, retourner un résultat neutre
        checks.push({
            pass: false,
            title: 'Analyse SpamAssassin',
            description: `❌ Impossible d'analyser: ${error.message}. Le service est peut-être temporairement indisponible.`
        });

        return {
            score: 0,
            maxScore,
            checks,
            error: true
        };
    }
}

// Fonction principale d'analyse
async function analyzeEmail() {
    // Afficher un indicateur de chargement pour SpamAssassin
    const loadingIndicator = document.getElementById('spam-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    // Analyses synchrones
    const syncResults = {
        content: analyzeContent(),
        images: analyzeImages(),
        links: analyzeLinks(),
        performance: analyzePerformance(),
        compliance: analyzeCompliance()
    };

    // Analyse asynchrone SpamAssassin
    const spamResult = await analyzeSpamScore();

    // Masquer l'indicateur de chargement
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    return {
        ...syncResults,
        spam: spamResult
    };
}

// Analyse de la structure HTML
function analyzeStructure() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    // DOCTYPE (HTML5 ou XHTML acceptés pour emails)
    const hasHTML5Doctype = emailHTMLOriginal.toLowerCase().includes('<!doctype html');
    const hasXHTMLDoctype = emailHTMLOriginal.toLowerCase().includes('<!doctype html public');
    const hasDoctype = hasHTML5Doctype || hasXHTMLDoctype;

    checks.push({
        pass: hasDoctype,
        title: 'DOCTYPE présent',
        description: hasHTML5Doctype
            ? 'DOCTYPE HTML5 présent - Standard moderne'
            : hasXHTMLDoctype
                ? 'DOCTYPE XHTML présent - Compatible emails'
                : 'Ajoutez <!DOCTYPE html> pour une meilleure compatibilité'
    });
    if (hasDoctype) score += 12;

    // Balise <title>
    const hasTitle = emailDoc.querySelector('title') !== null;
    checks.push({
        pass: hasTitle,
        title: 'Balise <title>',
        description: hasTitle ? 'La balise title est présente' : 'Ajoutez une balise <title> pour identifier l\'email'
    });
    if (hasTitle) score += 8;

    // Utilisation de tableaux (standard email)
    const tables = emailDoc.querySelectorAll('table');
    const hasTables = tables.length > 0;
    checks.push({
        pass: hasTables,
        title: 'Utilisation de tableaux',
        description: hasTables
            ? `${tables.length} tableau(x) - Standard pour layout email`
            : 'Utilisez des tableaux pour la mise en page (meilleure compatibilité)'
    });
    if (hasTables) score += 15;

    // CSS inline vs externe
    const elementsWithStyle = emailDoc.querySelectorAll('[style]');
    const inlineStylesCount = elementsWithStyle.length;
    const externalStyles = emailDoc.querySelectorAll('link[rel="stylesheet"]');
    const hasExternalCSS = externalStyles.length > 0;

    checks.push({
        pass: !hasExternalCSS,
        title: 'Pas de CSS externe',
        description: hasExternalCSS
            ? 'CSS externe détecté - Utilisez plutôt du CSS inline'
            : 'Pas de CSS externe - Excellent'
    });
    if (!hasExternalCSS) score += 15;

    checks.push({
        pass: inlineStylesCount > 0,
        title: 'CSS inline présent',
        description: inlineStylesCount > 0
            ? `${inlineStylesCount} éléments avec style inline - Bonne pratique`
            : 'Ajoutez du CSS inline pour une meilleure compatibilité'
    });
    if (inlineStylesCount > 0) score += 15;

    // Largeur optimale (640px selon Badsender)
    const bodyOrTable = emailDoc.querySelector('body > table, body > div > table, body > center > table');
    let hasOptimalWidth = false;
    let currentWidth = 0;
    if (bodyOrTable) {
        const widthAttr = bodyOrTable.getAttribute('width');
        const widthStyle = bodyOrTable.style.width;
        const width = widthAttr || widthStyle;
        if (width) {
            currentWidth = parseInt(width);
            hasOptimalWidth = currentWidth >= 600 && currentWidth <= 650;
        }
    }

    checks.push({
        pass: hasOptimalWidth,
        title: 'Largeur optimale (600-650px)',
        description: hasOptimalWidth
            ? `${currentWidth}px - Largeur optimale pour emails`
            : currentWidth > 0
                ? `${currentWidth}px - Recommandé : 600-650px max`
                : 'Définissez une largeur de 600-650px pour compatibilité mobile'
    });
    if (hasOptimalWidth) score += 12;

    // Pre-header présent (Batch.com best practice)
    // Chercher dans le DOM
    const preheader = emailDoc.querySelector('div[style*="display:none"], div[style*="display: none"], div[style*="display:none;"], div[style*="display: none;"]');

    // Chercher aussi dans le HTML brut (pour pre-headers dans <head>)
    const preheaderRegex = /<div[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>(.*?)<\/div>/gi;
    const preheaderMatches = emailHTMLOriginal.match(preheaderRegex);
    let preheaderText = '';

    if (preheader && preheader.textContent.trim().length > 0) {
        preheaderText = preheader.textContent.trim();
    } else if (preheaderMatches && preheaderMatches.length > 0) {
        // Extraire le texte du premier pre-header trouvé
        const match = preheaderMatches[0].match(/>(.*?)<\/div>/i);
        if (match && match[1]) {
            preheaderText = match[1].replace(/<[^>]*>/g, '').trim();
        }
    }

    const hasPreheader = preheaderText.length > 0;
    checks.push({
        pass: hasPreheader,
        title: 'Pre-header présent',
        description: hasPreheader
            ? `Pre-header détecté (${preheaderText.substring(0, 50)}${preheaderText.length > 50 ? '...' : ''}) - Optimise l'aperçu inbox`
            : 'Ajoutez un pre-header caché pour améliorer l\'aperçu dans les clients mail'
    });
    if (hasPreheader) score += 13;

    // Images Base64 (à éviter selon Batch.com)
    const base64Images = emailHTMLOriginal.match(/src=["']data:image/gi) || [];
    const hasBase64 = base64Images.length > 0;
    checks.push({
        pass: !hasBase64,
        title: 'Pas d\'images Base64',
        description: hasBase64
            ? `${base64Images.length} image(s) Base64 - Alourdit l'email, hébergez-les en ligne`
            : 'Pas d\'images Base64 - Excellent'
    });
    if (!hasBase64) score += 10;

    return {
        score: Math.round(score),
        maxScore,
        checks
    };
}

// Analyse du contenu
function analyzeContent() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    // Texte du contenu
    const textContent = emailDoc.body.textContent || '';
    const textLength = textContent.trim().length;

    checks.push({
        pass: textLength > 100,
        title: 'Longueur du texte suffisante',
        description: textLength > 100
            ? `${textLength} caractères - Suffisant`
            : `${textLength} caractères - Minimum 100 caractères recommandé`
    });
    if (textLength > 100) score += 15;

    // Ratio texte/HTML (Badsender: impact modéré)
    const htmlLength = emailHTML.length;
    const textRatio = (textLength / htmlLength) * 100;

    checks.push({
        pass: textRatio > 15,
        title: 'Ratio texte/HTML',
        description: `${textRatio.toFixed(1)}% de texte - ${textRatio > 15 ? 'Bon équilibre' : 'Augmentez le contenu textuel'}`
    });
    if (textRatio > 15) score += 15;
    else if (textRatio > 10) score += 8;

    // Mots spam (note Badsender: impact limité mais à surveiller)
    const lowerContent = textContent.toLowerCase();
    const spamWordsFound = SPAM_WORDS.filter(word => lowerContent.includes(word.toLowerCase()));

    checks.push({
        pass: spamWordsFound.length < 3,
        title: 'Mots à risque spam',
        description: spamWordsFound.length === 0
            ? 'Aucun mot à risque détecté'
            : spamWordsFound.length < 3
                ? `${spamWordsFound.length} mot(s) à surveiller: ${spamWordsFound.slice(0, 2).join(', ')}`
                : `${spamWordsFound.length} mots à risque: ${spamWordsFound.slice(0, 3).join(', ')}... - Réduisez leur usage`
    });
    if (spamWordsFound.length === 0) score += 20;
    else if (spamWordsFound.length < 3) score += 12;
    else if (spamWordsFound.length < 5) score += 6;

    // Majuscules excessives
    const uppercaseRatio = textContent.length > 0 ? (textContent.match(/[A-Z]/g) || []).length / textContent.length * 100 : 0;
    checks.push({
        pass: uppercaseRatio < 30,
        title: 'Utilisation des majuscules',
        description: uppercaseRatio < 30
            ? `${uppercaseRatio.toFixed(1)}% de majuscules - Correct`
            : 'Trop de majuscules - Évitez les PHRASES EN CAPITALES'
    });
    if (uppercaseRatio < 30) score += 12;

    // Points d'exclamation
    const exclamationCount = (textContent.match(/!/g) || []).length;
    checks.push({
        pass: exclamationCount < 5,
        title: 'Points d\'exclamation',
        description: exclamationCount < 5
            ? `${exclamationCount} point(s) d'exclamation - Acceptable`
            : `${exclamationCount} points d'exclamation - Réduisez pour éviter l\'aspect spam`
    });
    if (exclamationCount < 5) score += 10;

    // Contenu lisible sans images (Badsender best practice)
    const images = emailDoc.querySelectorAll('img');
    const totalImgTextLength = Array.from(images).reduce((sum, img) => {
        return sum + (img.getAttribute('alt') || '').length;
    }, 0);

    const textWithoutImgAlt = textLength - totalImgTextLength;
    const isReadableWithoutImages = textWithoutImgAlt > 50;

    checks.push({
        pass: isReadableWithoutImages,
        title: 'Email lisible sans images',
        description: isReadableWithoutImages
            ? 'L\'email reste lisible même sans images - Excellent'
            : 'Assurez-vous que l\'email soit compréhensible sans affichage des images'
    });
    if (isReadableWithoutImages) score += 18;

    // Adresse physique présente (exigence légale selon Batch.com)
    const hasPhysicalAddress = /\d+.*(?:rue|avenue|boulevard|street|road|ave|blvd|way)/i.test(textContent) ||
                              /\d{5}/.test(textContent); // Code postal

    checks.push({
        pass: hasPhysicalAddress,
        title: 'Adresse physique dans le footer',
        description: hasPhysicalAddress
            ? 'Adresse physique détectée - Conformité légale (CAN-SPAM, RGPD)'
            : 'Ajoutez votre adresse postale dans le footer (obligation légale)'
    });
    if (hasPhysicalAddress) score += 10;

    return {
        score: Math.round(score),
        maxScore,
        checks
    };
}

// Analyse des images
function analyzeImages() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    const images = emailDoc.querySelectorAll('img');
    const imageCount = images.length;

    // Nombre d'images raisonnable
    checks.push({
        pass: imageCount > 0 && imageCount < 15,
        title: 'Nombre d\'images approprié',
        description: imageCount === 0
            ? 'Aucune image - Ajoutez des visuels'
            : imageCount < 15
                ? `${imageCount} image(s) - Quantité appropriée`
                : `${imageCount} images - Trop d'images peut ralentir le chargement`
    });
    if (imageCount > 0 && imageCount < 15) score += 20;
    else if (imageCount === 0) score += 10;

    // Attributs alt OBLIGATOIRES (Badsender + Batch.com)
    let imagesWithAlt = 0;
    let imagesWithEmptyAlt = 0;
    images.forEach(img => {
        if (img.hasAttribute('alt')) {
            imagesWithAlt++;
            if (img.getAttribute('alt').trim() === '') {
                imagesWithEmptyAlt++;
            }
        }
    });

    const altRatio = imageCount > 0 ? (imagesWithAlt / imageCount) * 100 : 100;
    checks.push({
        pass: altRatio === 100,
        title: 'Attributs alt sur TOUTES les images',
        description: imageCount === 0
            ? 'Pas d\'images'
            : altRatio === 100
                ? `Toutes les images ont un attribut alt - Excellent (${imagesWithEmptyAlt} vides pour décoratives)`
                : `${imagesWithAlt}/${imageCount} images avec alt - OBLIGATOIRE sur toutes les images`
    });
    if (altRatio === 100) score += 30;
    else if (altRatio > 80) score += 20;
    else if (altRatio > 50) score += 10;

    // Dimensions spécifiées
    let imagesWithDimensions = 0;
    images.forEach(img => {
        if ((img.hasAttribute('width') && img.hasAttribute('height')) ||
            (img.style.width && img.style.height)) {
            imagesWithDimensions++;
        }
    });

    const dimensionsRatio = imageCount > 0 ? (imagesWithDimensions / imageCount) * 100 : 100;
    checks.push({
        pass: dimensionsRatio > 80,
        title: 'Dimensions des images spécifiées',
        description: imageCount === 0
            ? 'Pas d\'images'
            : `${imagesWithDimensions}/${imageCount} images avec dimensions - ${dimensionsRatio > 80 ? 'Excellent' : 'Spécifiez width et height'}`
    });
    if (dimensionsRatio > 80) score += 20;
    else if (dimensionsRatio > 50) score += 10;

    // Images hébergées en ligne (pas locales, pas Base64)
    let externalImages = 0;
    let base64Images = 0;
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
            if (src.startsWith('http://') || src.startsWith('https://')) {
                externalImages++;
            } else if (src.startsWith('data:')) {
                base64Images++;
            }
        }
    });

    checks.push({
        pass: externalImages === imageCount && base64Images === 0,
        title: 'Images hébergées en ligne',
        description: imageCount === 0
            ? 'Pas d\'images'
            : externalImages === imageCount
                ? 'Toutes les images sont hébergées en ligne - Excellent'
                : base64Images > 0
                    ? `${base64Images} image(s) Base64 - Hébergez-les en ligne pour réduire le poids`
                    : `${imageCount - externalImages} image(s) locales - Utilisez des URLs absolues (https://)`
    });
    if (imageCount === 0 || (externalImages === imageCount && base64Images === 0)) score += 30;
    else if (base64Images === 0) score += 15;

    return {
        score: Math.round(score),
        maxScore,
        checks
    };
}

// Analyse des liens
function analyzeLinks() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    const links = emailDoc.querySelectorAll('a');
    const linkCount = links.length;

    // Nombre de liens optimal
    checks.push({
        pass: linkCount > 0 && linkCount < 30,
        title: 'Nombre de liens optimal',
        description: linkCount === 0
            ? 'Aucun lien - Ajoutez au moins un CTA'
            : linkCount < 30
                ? `${linkCount} lien(s) - Quantité appropriée`
                : `${linkCount} liens - Limitez à 30 maximum pour éviter les filtres spam`
    });
    if (linkCount > 0 && linkCount < 30) score += 20;
    else if (linkCount >= 30 && linkCount < 50) score += 10;

    // Protocole HTTPS obligatoire (Batch.com)
    let httpsLinks = 0;
    let httpLinks = 0;
    let mixedContent = false;

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            if (href.startsWith('https://')) httpsLinks++;
            else if (href.startsWith('http://')) {
                httpLinks++;
                mixedContent = true;
            }
        }
    });

    checks.push({
        pass: httpLinks === 0 && httpsLinks > 0,
        title: 'Protocole HTTPS sur tous les liens',
        description: httpLinks === 0 && httpsLinks > 0
            ? 'Tous les liens utilisent HTTPS - Sécurisé et conforme'
            : httpLinks > 0
                ? `${httpLinks} lien(s) en HTTP - UTILISEZ HTTPS pour tous les liens (sécurité + déliverabilité)`
                : 'Vérifiez les protocoles des liens'
    });
    if (httpLinks === 0 && httpsLinks > 0) score += 25;
    else if (httpLinks < 3) score += 12;

    // Lien de désinscription OBLIGATOIRE (Batch.com + légal)
    let hasUnsubscribe = false;
    let unsubscribePosition = 'none';

    links.forEach((link, index) => {
        const text = link.textContent.toLowerCase();
        const href = (link.getAttribute('href') || '').toLowerCase();
        const dataAttr = link.getAttribute('data-msys-unsubscribe');

        if (text.includes('unsubscribe') || text.includes('désinscrire') ||
            text.includes('désinscription') || text.includes('se désabonner') ||
            href.includes('unsubscribe') || dataAttr === '1') {
            hasUnsubscribe = true;
            // Déterminer si c'est dans le dernier tiers de l'email (footer)
            unsubscribePosition = index > (linkCount * 0.66) ? 'footer' : 'top';
        }
    });

    checks.push({
        pass: hasUnsubscribe,
        title: 'Lien de désinscription OBLIGATOIRE',
        description: hasUnsubscribe
            ? `Lien de désinscription présent (${unsubscribePosition}) - Conformité légale (RGPD, CAN-SPAM)`
            : 'AJOUTEZ un lien de désinscription clair et visible (obligation légale)'
    });
    if (hasUnsubscribe) score += 30;

    // Texte des liens descriptif
    let linksWithGoodText = 0;
    let badLinkTexts = [];

    links.forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        if (text.length > 0) {
            if (text === 'cliquez ici' || text === 'click here' ||
                text === 'ici' || text === 'here') {
                badLinkTexts.push(text);
            } else {
                linksWithGoodText++;
            }
        }
    });

    const goodTextRatio = linkCount > 0 ? (linksWithGoodText / linkCount) * 100 : 100;
    checks.push({
        pass: badLinkTexts.length === 0,
        title: 'Texte descriptif des liens',
        description: linkCount === 0
            ? 'Pas de liens'
            : badLinkTexts.length === 0
                ? 'Tous les liens ont un texte descriptif - Excellent pour l\'accessibilité'
                : `${badLinkTexts.length} lien(s) avec texte générique ("cliquez ici") - Utilisez des textes descriptifs`
    });
    if (badLinkTexts.length === 0) score += 15;
    else if (badLinkTexts.length < 3) score += 8;

    // List-Unsubscribe header (vérification dans le code si présent)
    const hasListUnsubHeader = emailHTMLOriginal.includes('list-unsubscribe') ||
                               emailHTMLOriginal.includes('List-Unsubscribe');

    checks.push({
        pass: hasListUnsubHeader,
        title: 'List-Unsubscribe header',
        description: hasListUnsubHeader
            ? 'List-Unsubscribe header détecté - One-click unsubscribe (Gmail, Yahoo)'
            : 'Recommandé : Ajoutez un header List-Unsubscribe pour faciliter la désinscription'
    });
    if (hasListUnsubHeader) score += 10;

    return {
        score: Math.round(score),
        maxScore,
        checks
    };
}

// Analyse de la performance
function analyzePerformance() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    // Taille HTML < 102KB (limite Gmail - Batch.com)
    const htmlSize = new Blob([emailHTML]).size;
    const htmlSizeKB = htmlSize / 1024;

    checks.push({
        pass: htmlSizeKB < 102,
        title: 'Poids HTML < 102KB (Gmail)',
        description: htmlSizeKB < 102
            ? `${htmlSizeKB.toFixed(1)} KB - Sous la limite Gmail (102KB)`
            : `${htmlSizeKB.toFixed(1)} KB - DÉPASSÉ! Gmail va tronquer l'email ([Message clipped])`
    });
    if (htmlSizeKB < 102) score += 35;
    else if (htmlSizeKB < 120) score += 20;
    else score += 5;

    // Poids total < 500KB (Badsender recommendation)
    const totalSize = htmlSize;
    const totalSizeKB = totalSize / 1024;

    checks.push({
        pass: totalSizeKB < 500,
        title: 'Poids total < 500KB',
        description: totalSizeKB < 500
            ? `${totalSizeKB.toFixed(1)} KB - Excellent pour éco-conception`
            : `${totalSizeKB.toFixed(1)} KB - Optimisez le poids (max 500KB recommandé)`
    });
    if (totalSizeKB < 500) score += 20;
    else if (totalSizeKB < 1000) score += 10;

    // Nombre de requêtes externes
    const externalImages = emailDoc.querySelectorAll('img[src^="http"]');
    const externalResources = emailDoc.querySelectorAll('link[href^="http"], script[src^="http"]');
    const totalRequests = externalImages.length + externalResources.length;

    checks.push({
        pass: totalRequests < 20,
        title: 'Requêtes externes limitées',
        description: `${totalRequests} requête(s) externe(s) - ${totalRequests < 20 ? 'Optimal' : 'Réduisez le nombre de ressources'}`
    });
    if (totalRequests < 20) score += 15;
    else if (totalRequests < 40) score += 8;

    // JavaScript (bloqué par la plupart des clients mail)
    // Méthode 1 : Chercher dans le DOM parsé
    const scripts = emailDoc.querySelectorAll('script');

    // Méthode 2 : Chercher dans le HTML ORIGINAL (AVANT parsing qui supprime les scripts)
    // Gérer à la fois les balises normales ET les balises échappées (&lt;script&gt;)
    const scriptOpeningTags = (emailHTMLOriginal.match(/<script[\s\S]*?>/gi) || []);
    const scriptClosingTags = (emailHTMLOriginal.match(/<\/script>/gi) || []);

    // Détecter aussi les scripts échappés
    const escapedScriptOpeningTags = (emailHTMLOriginal.match(/&lt;script[\s\S]*?&gt;/gi) || []);
    const escapedScriptClosingTags = (emailHTMLOriginal.match(/&lt;\/script&gt;/gi) || []);

    // Le nombre total de scripts = max entre toutes les détections
    const scriptCountFromHTML = Math.max(
        scriptOpeningTags.length,
        scriptClosingTags.length,
        escapedScriptOpeningTags.length,
        escapedScriptClosingTags.length
    );

    const totalScriptTags = Math.max(scripts.length, scriptCountFromHTML);

    // Détecter les event handlers inline (onclick, onload, etc.)
    const eventHandlers = emailDoc.querySelectorAll('[onclick], [onload], [onerror], [onmouseover], [onmouseout], [onmousedown], [onmouseup], [onfocus], [onblur], [onchange], [onsubmit]');

    // Détecter aussi les event handlers dans le HTML ORIGINAL
    const eventHandlerPattern = /\s+on(click|load|error|mouseover|mouseout|mousedown|mouseup|focus|blur|change|submit)\s*=/gi;
    const eventHandlersInRawHTML = (emailHTMLOriginal.match(eventHandlerPattern) || []).length;
    const totalEventHandlers = Math.max(eventHandlers.length, eventHandlersInRawHTML);

    // Détecter les URLs javascript:
    const javascriptUrls = emailDoc.querySelectorAll('[href^="javascript:"], [src^="javascript:"]');
    const javascriptUrlsInRawHTML = (emailHTMLOriginal.match(/(?:href|src)\s*=\s*["']javascript:/gi) || []).length;
    const totalJavascriptUrls = Math.max(javascriptUrls.length, javascriptUrlsInRawHTML);

    // Compter tous les types de JavaScript détectés
    const totalJsIssues = totalScriptTags + totalEventHandlers + totalJavascriptUrls;
    const hasScripts = totalJsIssues > 0;

    // Construire le message de description détaillé
    let jsDescription = '';
    if (hasScripts) {
        const issues = [];
        if (totalScriptTags > 0) issues.push(`${totalScriptTags} balise(s) <script>`);
        if (totalEventHandlers > 0) issues.push(`${totalEventHandlers} event handler(s) inline (onclick, onload, etc.)`);
        if (totalJavascriptUrls > 0) issues.push(`${totalJavascriptUrls} URL(s) javascript:`);
        jsDescription = `JavaScript détecté : ${issues.join(', ')} - Bloqué par la plupart des clients mail`;
    } else {
        jsDescription = 'Pas de JavaScript - Conforme aux limitations email';
    }

    checks.push({
        pass: !hasScripts,
        title: 'Pas de JavaScript',
        description: jsDescription
    });
    if (!hasScripts) score += 15;

    // Formulaires (non supportés)
    const forms = emailDoc.querySelectorAll('form');
    const hasForms = forms.length > 0;

    checks.push({
        pass: !hasForms,
        title: 'Pas de formulaires',
        description: hasForms
            ? `${forms.length} formulaire(s) - Non supportés par la plupart des clients mail`
            : 'Pas de formulaires - Conforme'
    });
    if (!hasForms) score += 15;

    return {
        score: Math.round(score),
        maxScore,
        checks
    };
}

// NOUVELLE CATÉGORIE : Conformité légale
function analyzeCompliance() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    const textContent = emailDoc.body.textContent || '';
    const links = emailDoc.querySelectorAll('a');

    // Lien de désinscription visible
    let hasUnsubscribe = false;
    links.forEach(link => {
        const text = link.textContent.toLowerCase();
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (text.includes('unsubscribe') || text.includes('désinscrire') ||
            text.includes('désinscription') || href.includes('unsubscribe')) {
            hasUnsubscribe = true;
        }
    });

    checks.push({
        pass: hasUnsubscribe,
        title: 'Lien de désinscription visible',
        description: hasUnsubscribe
            ? 'Lien de désinscription présent - Conformité RGPD/CAN-SPAM'
            : 'OBLIGATOIRE : Ajoutez un lien de désinscription clair'
    });
    if (hasUnsubscribe) score += 30;

    // Adresse physique (CAN-SPAM Act requirement)
    const hasPhysicalAddress = /\d+.*(?:rue|avenue|boulevard|street|road|ave|blvd|way|place)/i.test(textContent) ||
                              /\d{5}/.test(textContent);

    checks.push({
        pass: hasPhysicalAddress,
        title: 'Adresse postale physique',
        description: hasPhysicalAddress
            ? 'Adresse postale détectée - Conformité CAN-SPAM Act'
            : 'OBLIGATOIRE (USA) : Ajoutez votre adresse postale dans le footer'
    });
    if (hasPhysicalAddress) score += 25;

    // Pre-header pour aperçu
    const preheader = emailDoc.querySelector('div[style*="display:none"], div[style*="display: none"]');
    const hasPreheader = preheader !== null && preheader.textContent.trim().length > 10;

    checks.push({
        pass: hasPreheader,
        title: 'Pre-header optimisé',
        description: hasPreheader
            ? `Pre-header présent (${preheader.textContent.trim().length} caractères) - Améliore l'aperçu inbox`
            : 'Ajoutez un pre-header (texte caché) pour optimiser l\'aperçu dans les boîtes mail'
    });
    if (hasPreheader) score += 20;

    // Identification claire de l'expéditeur
    const fromField = emailDoc.querySelector('[name="from"], meta[name="from"]');
    const hasFromIdentification = fromField !== null || textContent.toLowerCase().includes('de la part de') ||
                                   textContent.toLowerCase().includes('envoyé par');

    checks.push({
        pass: hasFromIdentification,
        title: 'Identification de l\'expéditeur',
        description: hasFromIdentification
            ? 'Expéditeur identifiable - Transparence pour les destinataires'
            : 'Identifiez clairement l\'expéditeur en ajoutant : une balise &lt;meta name="from" content="Votre entreprise"&gt;, ou une mention "De la part de..." / "Envoyé par..." dans le contenu',
        pdfDescription: hasFromIdentification
            ? 'Expéditeur identifiable - Transparence pour les destinataires'
            : 'Identifiez clairement l\'expéditeur en ajoutant : une balise HTML qui identifie votre entreprise, ou une mention "De la part de..." / "Envoyé par..." dans le contenu'
    });
    if (hasFromIdentification) score += 15;

    // Responsive / Mobile-friendly
    const hasViewport = emailHTMLOriginal.includes('viewport') || emailHTMLOriginal.includes('device-width');
    const hasMediaQueries = emailHTMLOriginal.includes('@media');

    checks.push({
        pass: hasViewport || hasMediaQueries,
        title: 'Optimisation mobile',
        description: hasViewport || hasMediaQueries
            ? 'Meta viewport ou media queries détectés - Design responsive'
            : 'Ajoutez une optimisation mobile (viewport meta tag ou media queries)'
    });
    if (hasViewport || hasMediaQueries) score += 10;

    return {
        score: Math.round(score),
        maxScore,
        checks
    };
}

// Afficher les résultats
function displayResults(results) {
    // Calculer le score global (6 catégories incluant SpamAssassin)
    // Si SpamAssassin a une erreur, on ignore cette catégorie dans le calcul
    const categoriesCount = results.spam && !results.spam.error ? 6 : 5;

    let scoreSum = (
        results.content.score / results.content.maxScore +
        results.images.score / results.images.maxScore +
        results.links.score / results.links.maxScore +
        results.performance.score / results.performance.maxScore +
        results.compliance.score / results.compliance.maxScore
    );

    if (results.spam && !results.spam.error) {
        scoreSum += results.spam.score / results.spam.maxScore;
    }

    const totalScore = Math.round(scoreSum / categoriesCount * 100);

    // Sauvegarder pour l'export PDF
    saveResultsForExport(results, totalScore);

    // Afficher le score
    const scoreCircle = document.getElementById('score-circle');
    const scoreValue = document.getElementById('score-value');
    const scoreStatus = document.getElementById('score-status');

    scoreValue.textContent = totalScore;
    scoreCircle.style.setProperty('--score-deg', `${totalScore * 3.6}deg`);

    // Déterminer le statut
    let status, statusClass;
    if (totalScore >= 90) {
        status = 'Excellent';
        statusClass = 'excellent';
    } else if (totalScore >= 75) {
        status = 'Bon';
        statusClass = 'good';
    } else if (totalScore >= 60) {
        status = 'Moyen';
        statusClass = 'average';
    } else if (totalScore >= 40) {
        status = 'Faible';
        statusClass = 'poor';
    } else {
        status = 'Mauvais';
        statusClass = 'bad';
    }

    scoreStatus.textContent = status;
    scoreStatus.className = `score-status ${statusClass}`;

    // Afficher les détails par catégorie
    displayCategory('content', results.content);
    displayCategory('images', results.images);
    displayCategory('links', results.links);
    displayCategory('performance', results.performance);
    displayCategory('compliance', results.compliance);

    // Afficher la catégorie SpamAssassin
    if (results.spam) {
        displayCategory('spam', results.spam);
    }

    // Générer les recommandations
    generateRecommendations(results);

    // Afficher la section résultats
    document.querySelector('.upload-section').style.display = 'none';
    resultsSection.style.display = 'block';
}

// Afficher une catégorie
function displayCategory(categoryName, categoryData) {
    const scoreElement = document.getElementById(`${categoryName}-score`);
    const itemsElement = document.getElementById(`${categoryName}-items`);

    const scorePercent = Math.round((categoryData.score / categoryData.maxScore) * 100);
    scoreElement.textContent = `${scorePercent}%`;

    let scoreClass;
    if (scorePercent >= 90) scoreClass = 'excellent';
    else if (scorePercent >= 75) scoreClass = 'good';
    else if (scorePercent >= 60) scoreClass = 'average';
    else if (scorePercent >= 40) scoreClass = 'poor';
    else scoreClass = 'bad';

    scoreElement.className = `category-score ${scoreClass}`;

    // Afficher les checks
    itemsElement.innerHTML = categoryData.checks.map(check => {
        const status = check.pass ? 'pass' : 'fail';
        const icon = check.pass ? '✓' : '✗';

        return `
            <div class="check-item ${status}">
                <div class="check-icon">${icon}</div>
                <div class="check-content">
                    <div class="check-title">${check.title}</div>
                    <div class="check-description">${check.description}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Générer les recommandations prioritaires
function generateRecommendations(results) {
    const recommendations = [];

    // Collecter tous les checks qui ont échoué
    Object.values(results).forEach(category => {
        category.checks.forEach(check => {
            if (!check.pass) {
                recommendations.push({
                    text: check.description,
                    priority: determinePriority(check.title)
                });
            }
        });
    });

    // Trier par priorité
    recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Afficher les recommandations (max 8)
    const recommendationsList = document.getElementById('recommendations-list');
    if (recommendations.length === 0) {
        recommendationsList.innerHTML = '<p style="color: #4CAF50; font-weight: 600;">🎉 Aucune recommandation - Votre email respecte toutes les bonnes pratiques de déliverabilité !</p>';
    } else {
        recommendationsList.innerHTML = recommendations.slice(0, 8).map(rec => `
            <div class="recommendation-item ${rec.priority}">
                <div class="recommendation-priority ${rec.priority}">${rec.priority.toUpperCase()}</div>
                <div class="recommendation-text">${rec.text}</div>
            </div>
        `).join('');
    }
}

// Déterminer la priorité d'une recommandation
function determinePriority(checkTitle) {
    // Priorité HAUTE : Conformité légale + sécurité
    const highPriority = [
        'désinscription', 'Adresse postale', 'alt', 'HTTPS',
        'Gmail', '102KB', 'OBLIGATOIRE'
    ];

    // Priorité MOYENNE : Bonnes pratiques importantes
    const mediumPriority = [
        'CSS externe', 'DOCTYPE', 'Ratio texte', 'JavaScript',
        'Base64', 'Pre-header', 'lisible sans images'
    ];

    const titleLower = checkTitle.toLowerCase();

    if (highPriority.some(p => titleLower.includes(p.toLowerCase()))) return 'high';
    if (mediumPriority.some(p => titleLower.includes(p.toLowerCase()))) return 'medium';
    return 'low';
}

// Réinitialiser
resetBtn.addEventListener('click', () => {
    emailHTML = '';
    emailDoc = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    resultsSection.style.display = 'none';
    document.querySelector('.upload-section').style.display = 'block';
});

// Utilitaires
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Export PDF
const exportPdfBtn = document.getElementById('export-pdf-btn');
let currentResults = null;
let currentTotalScore = 0;
let currentFileName = '';

// Sauvegarder les résultats lors de l'affichage
function saveResultsForExport(results, totalScore) {
    currentResults = results;
    currentTotalScore = totalScore;
    currentFileName = fileName.textContent || 'email.html';
}

exportPdfBtn.addEventListener('click', () => {
    if (!currentResults) {
        alert('Aucun résultat à exporter');
        return;
    }

    // Désactiver le bouton pendant l'export
    exportPdfBtn.disabled = true;
    exportPdfBtn.textContent = 'Génération en cours...';

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        let y = margin;

        // Fonction pour décoder les entités HTML
        const decodeHTML = (html) => {
            return html
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, '&');
        };

        // Fonction pour ajouter une nouvelle page
        const checkPageBreak = (neededSpace) => {
            if (y + neededSpace > pageHeight - margin) {
                doc.addPage();
                y = margin;
                return true;
            }
            return false;
        };

        // En-tête avec fond bleu (plus compact)
        doc.setFillColor(9, 104, 172);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Rapport d\'Analyse Email', margin, 15);

        // Retirer les emojis du nom de fichier
        const cleanFileName = currentFileName.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Fichier : ${cleanFileName}`, margin, 26);

        y = 45;

        // Score global avec encadré coloré
        doc.setTextColor(0, 0, 0);
        let scoreColor;
        let scoreLabel;
        if (currentTotalScore >= 90) {
            scoreColor = [16, 185, 129];
            scoreLabel = 'Excellent';
        } else if (currentTotalScore >= 75) {
            scoreColor = [9, 104, 172];
            scoreLabel = 'Bon';
        } else if (currentTotalScore >= 60) {
            scoreColor = [245, 158, 11];
            scoreLabel = 'Moyen';
        } else if (currentTotalScore >= 40) {
            scoreColor = [249, 115, 22];
            scoreLabel = 'Faible';
        } else {
            scoreColor = [239, 68, 68];
            scoreLabel = 'Mauvais';
        }

        // Encadré du score
        doc.setFillColor(...scoreColor);
        doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text(`Score Global: ${currentTotalScore}/100 - ${scoreLabel}`, pageWidth / 2, y + 16, { align: 'center' });

        y += 35;

        // Catégories (couleurs alignées sur l'analyseur)
        const categories = [
            { key: 'content', name: 'Contenu et Spam', color: [9, 104, 172] },
            { key: 'images', name: 'Images et Médias', color: [9, 104, 172] },
            { key: 'links', name: 'Liens et CTA', color: [9, 104, 172] },
            { key: 'performance', name: 'Performance', color: [9, 104, 172] },
            { key: 'compliance', name: 'Conformité Légale', color: [9, 104, 172] }
        ];

        categories.forEach((category, catIndex) => {
            const categoryData = currentResults[category.key];
            if (!categoryData) return;

            const score = Math.round((categoryData.score / categoryData.maxScore) * 100);

            // Calculer l'espace total nécessaire pour la catégorie
            let categoryHeight = 12 + 16; // En-tête + marge
            categoryData.checks.forEach(check => {
                const description = check.pdfDescription || check.description;
                const descLines = doc.splitTextToSize(description, contentWidth - 12);
                categoryHeight += 6 + (descLines.length * 3.5) + 2;
            });
            categoryHeight += 5; // Marge finale

            // Si la catégorie ne rentre pas, nouvelle page
            if (y + categoryHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            // En-tête de catégorie avec couleur vive
            doc.setFillColor(...category.color);
            doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`${category.name}`, margin + 3, y + 8);
            doc.text(`${score}%`, pageWidth - margin - 3, y + 8, { align: 'right' });

            y += 16;

            // Checks
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');

            categoryData.checks.forEach((check, checkIndex) => {
                // Icône et titre (utiliser des caractères simples sans emojis)
                const icon = check.pass ? 'OK' : 'X';
                const iconColor = check.pass ? [16, 185, 129] : [239, 68, 68];

                doc.setTextColor(...iconColor);
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.text(icon, margin + 2, y);

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(check.title, margin + 10, y);
                y += 5;

                // Description
                const description = check.pdfDescription || check.description;
                const descLines = doc.splitTextToSize(description, contentWidth - 12);
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(60, 60, 60);
                descLines.forEach(line => {
                    doc.text(line, margin + 10, y);
                    y += 3.5;
                });

                y += 2;
            });

            y += 5;
        });

        // Recommandations prioritaires

        // Collecter les recommandations (checks qui ont échoué)
        const recommendations = [];
        Object.values(currentResults).forEach(category => {
            category.checks.forEach(check => {
                if (!check.pass) {
                    let priority = 'low';
                    const titleLower = check.title.toLowerCase();

                    // Déterminer la priorité
                    const highPriority = ['désinscription', 'adresse postale', 'alt', 'https', 'gmail', '102kb', 'obligatoire'];
                    const mediumPriority = ['css externe', 'doctype', 'ratio texte', 'javascript', 'base64', 'pre-header', 'lisible sans images'];

                    if (highPriority.some(p => titleLower.includes(p.toLowerCase()))) priority = 'high';
                    else if (mediumPriority.some(p => titleLower.includes(p.toLowerCase()))) priority = 'medium';

                    recommendations.push({
                        text: check.description,
                        priority: priority
                    });
                }
            });
        });

        // Trier par priorité
        recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Calculer la hauteur de la section recommandations
        let recoHeight = 12 + 16; // En-tête + marge
        if (recommendations.length === 0) {
            recoHeight += 10;
        } else {
            recommendations.slice(0, 10).forEach(rec => {
                const recLines = doc.splitTextToSize(rec.text, contentWidth - 25);
                recoHeight += 8 + (recLines.length * 3.5) + 5;
            });
        }

        // Si la section ne rentre pas, nouvelle page
        if (y + recoHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        // En-tête de la section
        doc.setFillColor(9, 104, 172);
        doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Recommandations', margin + 3, y + 8);

        y += 16;

        if (recommendations.length === 0) {
            doc.setTextColor(16, 185, 129);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Aucune recommandation - Votre email respecte toutes les bonnes pratiques !', margin + 3, y);
            y += 10;
        } else {
            // Afficher les recommandations (max 10)
            recommendations.slice(0, 10).forEach((rec, index) => {
                // Définir les couleurs selon la priorité
                let badgeColor, bgColor;
                if (rec.priority === 'high') {
                    badgeColor = [239, 68, 68];
                    bgColor = [254, 226, 226]; // Rouge clair
                } else if (rec.priority === 'medium') {
                    badgeColor = [245, 158, 11];
                    bgColor = [254, 243, 199]; // Orange clair
                } else {
                    badgeColor = [9, 104, 172];
                    bgColor = [231, 241, 252]; // Bleu clair
                }

                // Calculer la hauteur du bloc
                const recLines = doc.splitTextToSize(rec.text, contentWidth - 25);
                const textHeight = recLines.length * 3.5;
                const blockHeight = textHeight + 6;

                // Fond coloré pour tout le bloc
                doc.setFillColor(...bgColor);
                doc.roundedRect(margin, y, contentWidth, blockHeight, 1, 1, 'F');

                // Calculer la position verticale centrée pour le badge
                const badgeY = y + (blockHeight / 2) - 2;

                // Badge de priorité
                doc.setFillColor(...badgeColor);
                doc.roundedRect(margin + 2, badgeY, 20, 6, 1, 1, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7);
                doc.setFont(undefined, 'bold');
                doc.text(rec.priority.toUpperCase(), margin + 12, badgeY + 4, { align: 'center' });

                // Texte de la recommandation centré verticalement
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');

                const textStartY = y + (blockHeight - textHeight) / 2 + 3;
                recLines.forEach((line, lineIndex) => {
                    doc.text(line, margin + 25, textStartY + (lineIndex * 3.5));
                });

                y += blockHeight + 4;
            });
        }

        y += 5;

        // Footer sur chaque page
        const pageCount = doc.internal.getNumberOfPages();
        const generatedDate = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(
                `${generatedDate} - Page ${i}/${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        // Télécharger
        const filename = `rapport-email-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Erreur lors de la génération du PDF');
    } finally {
        // Réactiver le bouton
        exportPdfBtn.disabled = false;
        exportPdfBtn.textContent = 'Exporter en PDF';
    }
});
