// Variables globales
let emailHTML = '';
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
analyzeBtn.addEventListener('click', () => {
    if (!emailHTML || !emailDoc) {
        alert('Veuillez d\'abord charger un fichier HTML');
        return;
    }

    const results = analyzeEmail();
    displayResults(results);
});

// Fonction principale d'analyse
function analyzeEmail() {
    return {
        structure: analyzeStructure(),
        content: analyzeContent(),
        images: analyzeImages(),
        links: analyzeLinks(),
        performance: analyzePerformance(),
        compliance: analyzeCompliance()
    };
}

// Analyse de la structure HTML
function analyzeStructure() {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    // DOCTYPE HTML5
    const hasDoctype = emailHTML.toLowerCase().includes('<!doctype html');
    checks.push({
        pass: hasDoctype,
        title: 'DOCTYPE HTML5',
        description: hasDoctype ? 'DOCTYPE HTML5 présent - Standard moderne' : 'Ajoutez <!DOCTYPE html> pour une meilleure compatibilité'
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
    const preheader = emailDoc.querySelector('div[style*="display:none"], div[style*="display: none"]');
    const hasPreheader = preheader !== null && preheader.textContent.trim().length > 0;
    checks.push({
        pass: hasPreheader,
        title: 'Pre-header présent',
        description: hasPreheader
            ? 'Pre-header détecté - Optimise l\'aperçu inbox'
            : 'Ajoutez un pre-header caché pour améliorer l\'aperçu dans les clients mail'
    });
    if (hasPreheader) score += 13;

    // Images Base64 (à éviter selon Batch.com)
    const base64Images = emailHTML.match(/src=["']data:image/gi) || [];
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
    const hasListUnsubHeader = emailHTML.includes('list-unsubscribe') ||
                               emailHTML.includes('List-Unsubscribe');

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
    const scripts = emailDoc.querySelectorAll('script');
    const hasScripts = scripts.length > 0;

    checks.push({
        pass: !hasScripts,
        title: 'Pas de JavaScript',
        description: hasScripts
            ? `${scripts.length} script(s) détecté(s) - JavaScript est bloqué par la plupart des clients mail`
            : 'Pas de JavaScript - Conforme aux limitations email'
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
            : 'Clarifiez l\'identité de l\'expéditeur dans l\'email'
    });
    if (hasFromIdentification) score += 15;

    // Responsive / Mobile-friendly
    const hasViewport = emailHTML.includes('viewport') || emailHTML.includes('device-width');
    const hasMediaQueries = emailHTML.includes('@media');

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
    // Calculer le score global (6 catégories maintenant)
    const totalScore = Math.round(
        (results.structure.score / results.structure.maxScore +
         results.content.score / results.content.maxScore +
         results.images.score / results.images.maxScore +
         results.links.score / results.links.maxScore +
         results.performance.score / results.performance.maxScore +
         results.compliance.score / results.compliance.maxScore) / 6 * 100
    );

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
    displayCategory('structure', results.structure);
    displayCategory('content', results.content);
    displayCategory('images', results.images);
    displayCategory('links', results.links);
    displayCategory('performance', results.performance);

    // Nouvelle catégorie Conformité
    displayCategory('compliance', results.compliance);

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
            <div class="recommendation-item">
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
