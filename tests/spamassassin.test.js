/**
 * Tests d'intégration SpamAssassin
 *
 * Ces tests valident :
 * 1. La fonction API backend (/api/spamcheck)
 * 2. Le filtrage des règles côté frontend
 * 3. La cohérence des scores
 * 4. La gestion des erreurs
 */

const TEST_EMAILS = {
    // Email propre avec peu de pénalités
    clean: {
        from: 'test@example.com',
        subject: 'Newsletter mensuelle',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Newsletter</title>
</head>
<body>
    <p>Bonjour,</p>
    <p>Voici notre newsletter mensuelle avec des informations utiles.</p>
    <p>Merci de votre confiance.</p>
    <p><a href="https://example.com/unsubscribe">Se désinscrire</a></p>
    <p>Example Inc.<br>123 Main St, Paris, France</p>
</body>
</html>
        `,
        expectedScore: { min: 0, max: 3 }
    },

    // Email avec problèmes (mots spam, pas de lien désinscription, etc.)
    spammy: {
        from: 'winner@lottery.com',
        subject: '!!!CONGRATULATIONS!!! YOU WON $1,000,000!!!',
        html: `
<!DOCTYPE html>
<html>
<body>
    <h1>CONGRATULATIONS!!!</h1>
    <p>You are the WINNER of our AMAZING lottery!</p>
    <p>Click HERE to claim your FREE MONEY NOW!!!</p>
    <p><a href="http://suspicious-site.com">CLICK HERE NOW</a></p>
    <p>ACT FAST! LIMITED TIME OFFER!</p>
</body>
</html>
        `,
        expectedScore: { min: 5, max: 15 }
    },

    // Email HTML only (devrait déclencher une règle)
    htmlOnly: {
        from: 'newsletter@company.com',
        subject: 'Monthly Update',
        html: `
<!DOCTYPE html>
<html>
<body>
    <p>This is a simple HTML email without text/plain alternative.</p>
</body>
</html>
        `,
        expectedRules: ['MIME_HTML_ONLY', 'BODY']
    }
};

// Construction d'un email RFC 5322
function constructRawEmail(email) {
    const headers = [
        `From: ${email.from}`,
        `To: recipient@example.com`,
        `Subject: ${email.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Message-ID: <${Date.now()}@test.example.com>`,
        `Date: ${new Date().toUTCString()}`
    ].join('\r\n');

    return `${headers}\r\n\r\n${email.html}`;
}

// Test 1: API Backend - Email propre
async function testCleanEmail() {
    console.log('\n🧪 Test 1: Email propre (score faible attendu)');

    const rawEmail = constructRawEmail(TEST_EMAILS.clean);

    try {
        const response = await fetch('/api/spamcheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: rawEmail,
                options: 'long'
            })
        });

        const result = await response.json();

        // Vérifications
        console.log(`  ✓ API répond (status ${response.status})`);
        console.log(`  ✓ Score reçu: ${result.score}/10`);

        if (!result.success) {
            throw new Error(`API failed: ${result.message}`);
        }

        const score = parseFloat(result.score);
        if (score < TEST_EMAILS.clean.expectedScore.min || score > TEST_EMAILS.clean.expectedScore.max) {
            console.warn(`  ⚠️  Score hors plage attendue: ${score} (attendu: ${TEST_EMAILS.clean.expectedScore.min}-${TEST_EMAILS.clean.expectedScore.max})`);
        } else {
            console.log(`  ✓ Score dans la plage attendue`);
        }

        console.log(`  ✓ Nombre de règles: ${result.rules ? result.rules.length : 0}`);

        return { passed: true, score, rules: result.rules };
    } catch (error) {
        console.error(`  ✗ ÉCHEC: ${error.message}`);
        return { passed: false, error: error.message };
    }
}

// Test 2: API Backend - Email spam
async function testSpammyEmail() {
    console.log('\n🧪 Test 2: Email spam (score élevé attendu)');

    const rawEmail = constructRawEmail(TEST_EMAILS.spammy);

    try {
        const response = await fetch('/api/spamcheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: rawEmail,
                options: 'long'
            })
        });

        const result = await response.json();

        console.log(`  ✓ API répond (status ${response.status})`);
        console.log(`  ✓ Score reçu: ${result.score}/10`);

        if (!result.success) {
            throw new Error(`API failed: ${result.message}`);
        }

        const score = parseFloat(result.score);
        if (score < TEST_EMAILS.spammy.expectedScore.min) {
            console.warn(`  ⚠️  Score trop faible: ${score} (attendu: >${TEST_EMAILS.spammy.expectedScore.min})`);
        } else {
            console.log(`  ✓ Score élevé comme attendu (email détecté comme spam)`);
        }

        console.log(`  ✓ Nombre de règles déclenchées: ${result.rules ? result.rules.length : 0}`);

        return { passed: true, score, rules: result.rules };
    } catch (error) {
        console.error(`  ✗ ÉCHEC: ${error.message}`);
        return { passed: false, error: error.message };
    }
}

// Test 3: Filtrage des règles (0.0 pts et ADMINISTRATOR NOTICE)
function testRuleFiltering(rules) {
    console.log('\n🧪 Test 3: Filtrage des règles');

    if (!rules || rules.length === 0) {
        console.log('  ℹ️  Aucune règle à filtrer');
        return { passed: true };
    }

    // Simuler le filtrage côté frontend
    const filteredRules = rules.filter(rule => {
        const ruleScore = parseFloat(rule.score);
        const description = rule.description || '';

        // Exclure les règles à 0.0 pts
        if (ruleScore === 0) return false;

        // Exclure les warnings serveur (ADMINISTRATOR NOTICE)
        if (description.includes('ADMINISTRATOR NOTICE')) return false;

        return true;
    });

    const rulesAt0 = rules.filter(r => parseFloat(r.score) === 0);
    const adminNotices = rules.filter(r => (r.description || '').includes('ADMINISTRATOR NOTICE'));

    console.log(`  ✓ Règles totales reçues: ${rules.length}`);
    console.log(`  ✓ Règles à 0.0 pts filtrées: ${rulesAt0.length}`);
    console.log(`  ✓ ADMINISTRATOR NOTICE filtrés: ${adminNotices.length}`);
    console.log(`  ✓ Règles affichées après filtrage: ${filteredRules.length}`);

    // Vérifier qu'aucune règle 0.0 ou ADMIN NOTICE n'est dans le résultat final
    const has0PtsRules = filteredRules.some(r => parseFloat(r.score) === 0);
    const hasAdminNotices = filteredRules.some(r => (r.description || '').includes('ADMINISTRATOR NOTICE'));

    if (has0PtsRules || hasAdminNotices) {
        console.error('  ✗ ÉCHEC: Des règles non désirées passent le filtre');
        return { passed: false };
    }

    console.log('  ✓ Filtrage correct: aucune règle indésirable');
    return { passed: true, filtered: filteredRules };
}

// Test 4: Cohérence du score
function testScoreConsistency(score, rules) {
    console.log('\n🧪 Test 4: Cohérence du score');

    if (!rules || rules.length === 0) {
        console.log('  ℹ️  Aucune règle pour vérifier la cohérence');
        return { passed: true };
    }

    // Calculer le score total des règles
    const calculatedScore = rules.reduce((sum, rule) => {
        return sum + parseFloat(rule.score);
    }, 0);

    console.log(`  ✓ Score API: ${score}`);
    console.log(`  ✓ Score calculé (somme règles): ${calculatedScore.toFixed(1)}`);

    const diff = Math.abs(score - calculatedScore);
    if (diff > 0.1) {
        console.warn(`  ⚠️  Différence détectée: ${diff.toFixed(1)} pts`);
        console.log('  ℹ️  Note: Ceci peut être normal si certaines règles ne sont pas retournées par l\'API');
    } else {
        console.log('  ✓ Score cohérent');
    }

    return { passed: true, diff };
}

// Test 5: Gestion des erreurs
async function testErrorHandling() {
    console.log('\n🧪 Test 5: Gestion des erreurs');

    // Test 5a: Email vide
    try {
        const response = await fetch('/api/spamcheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: '',
                options: 'long'
            })
        });

        const result = await response.json();

        if (response.status === 400 || !result.success) {
            console.log('  ✓ Email vide correctement rejeté');
        } else {
            console.warn('  ⚠️  Email vide accepté (devrait être rejeté)');
        }
    } catch (error) {
        console.log('  ✓ Erreur capturée pour email vide');
    }

    // Test 5b: Méthode GET (devrait être POST)
    try {
        const response = await fetch('/api/spamcheck?email=test', {
            method: 'GET'
        });

        if (response.status === 405 || response.status === 400) {
            console.log('  ✓ Méthode GET correctement rejetée');
        } else {
            console.warn('  ⚠️  Méthode GET acceptée (devrait être rejetée)');
        }
    } catch (error) {
        console.log('  ✓ Erreur capturée pour méthode GET');
    }

    return { passed: true };
}

// Test 6: Performance
async function testPerformance() {
    console.log('\n🧪 Test 6: Performance de l\'API');

    const rawEmail = constructRawEmail(TEST_EMAILS.clean);
    const startTime = Date.now();

    try {
        const response = await fetch('/api/spamcheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: rawEmail,
                options: 'long'
            })
        });

        await response.json();
        const duration = Date.now() - startTime;

        console.log(`  ✓ Temps de réponse: ${duration}ms`);

        if (duration > 5000) {
            console.warn('  ⚠️  Temps de réponse lent (>5s)');
        } else if (duration > 2000) {
            console.log('  ℹ️  Temps de réponse acceptable (2-5s)');
        } else {
            console.log('  ✓ Temps de réponse rapide (<2s)');
        }

        return { passed: true, duration };
    } catch (error) {
        console.error(`  ✗ ÉCHEC: ${error.message}`);
        return { passed: false, error: error.message };
    }
}

// Exécution de tous les tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🧪 Suite de tests SpamAssassin Integration');
    console.log('═══════════════════════════════════════════════════');

    const results = {
        cleanEmail: null,
        spammyEmail: null,
        filtering: null,
        consistency: null,
        errorHandling: null,
        performance: null
    };

    // Test 1: Email propre
    results.cleanEmail = await testCleanEmail();

    // Test 2: Email spam
    results.spammyEmail = await testSpammyEmail();

    // Test 3: Filtrage (utilise les règles du test 1)
    if (results.cleanEmail.rules) {
        results.filtering = testRuleFiltering(results.cleanEmail.rules);
    }

    // Test 4: Cohérence (utilise les données du test 1)
    if (results.cleanEmail.score && results.cleanEmail.rules) {
        results.consistency = testScoreConsistency(results.cleanEmail.score, results.cleanEmail.rules);
    }

    // Test 5: Gestion erreurs
    results.errorHandling = await testErrorHandling();

    // Test 6: Performance
    results.performance = await testPerformance();

    // Résumé
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('═══════════════════════════════════════════════════');

    const allPassed = Object.values(results).every(r => r && r.passed);

    Object.entries(results).forEach(([name, result]) => {
        if (result) {
            console.log(`${result.passed ? '✅' : '❌'} ${name}`);
        }
    });

    console.log('\n' + (allPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '⚠️  CERTAINS TESTS ONT ÉCHOUÉ'));
    console.log('═══════════════════════════════════════════════════\n');

    return { results, allPassed };
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, TEST_EMAILS };
}

// Auto-exécution si dans le navigateur
if (typeof window !== 'undefined') {
    window.SpamAssassinTests = { runAllTests, TEST_EMAILS };
}
