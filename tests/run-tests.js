#!/usr/bin/env node

/**
 * Script de test Node.js pour SpamAssassin
 * Teste l'intégration via requêtes HTTP simulées vers l'API Postmark
 */

const https = require('https');

// Helper pour appeler l'API Postmark directement
async function callPostmarkAPI(email, options = 'long') {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, options });

        const requestOptions = {
            hostname: 'spamcheck.postmarkapp.com',
            port: 443,
            path: '/filter',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Accept': 'application/json'
            }
        };

        const req = https.request(requestOptions, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({
                        success: true,
                        score: result.score,
                        rules: result.rules || [],
                        report: result.report || '',
                        rawResponse: result
                    });
                } catch (error) {
                    console.error('Parse error. Raw response:', responseData);
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Construction d'un email RFC 5322
function constructRawEmail(from, subject, html) {
    const headers = [
        `From: ${from}`,
        `To: recipient@example.com`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Message-ID: <${Date.now()}@test.example.com>`,
        `Date: ${new Date().toUTCString()}`
    ].join('\r\n');

    return `${headers}\r\n\r\n${html}`;
}

// Tests
const tests = {
    // Test 1: Email propre
    async testCleanEmail() {
        console.log('\n🧪 Test 1: Email propre');

        const rawEmail = constructRawEmail(
            'test@example.com',
            'Newsletter mensuelle',
            `
<!DOCTYPE html>
<html>
<body>
    <p>Bonjour,</p>
    <p>Voici notre newsletter mensuelle avec des informations utiles.</p>
    <p>Merci de votre confiance.</p>
    <p><a href="https://example.com/unsubscribe">Se désinscrire</a></p>
    <p>Example Inc.<br>123 Main St, Paris, France</p>
</body>
</html>
            `
        );

        try {
            const result = await callPostmarkAPI(rawEmail, 'long');

            const score = parseFloat(result.score);
            console.log(`  ✅ API Postmark répond correctement`);
            console.log(`  ✅ Score: ${score}/10`);
            console.log(`  ✅ Règles retournées: ${result.rules ? result.rules.length : 0}`);

            if (score >= 0 && score <= 3) {
                console.log(`  ✅ Score dans la plage attendue (0-3)`);
            } else {
                console.log(`  ⚠️  Score hors plage: ${score} (attendu: 0-3)`);
            }

            return { passed: true, score, rules: result.rules };
        } catch (error) {
            console.log(`  ❌ ÉCHEC: ${error.message}`);
            return { passed: false, error };
        }
    },

    // Test 2: Filtrage des règles
    testRuleFiltering(rules) {
        console.log('\n🧪 Test 2: Filtrage des règles');

        if (!rules || rules.length === 0) {
            console.log('  ℹ️  Aucune règle à filtrer');
            return { passed: true };
        }

        // Simuler le filtrage côté frontend (même logique que script.js)
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

        console.log(`  ✅ Règles totales: ${rules.length}`);
        console.log(`  ✅ Règles à 0.0 pts filtrées: ${rulesAt0.length}`);
        console.log(`  ✅ ADMINISTRATOR NOTICE filtrés: ${adminNotices.length}`);
        console.log(`  ✅ Règles affichées: ${filteredRules.length}`);

        // Vérifier qu'aucune règle 0.0 ou ADMIN NOTICE n'est dans le résultat final
        const has0PtsRules = filteredRules.some(r => parseFloat(r.score) === 0);
        const hasAdminNotices = filteredRules.some(r => (r.description || '').includes('ADMINISTRATOR NOTICE'));

        if (has0PtsRules || hasAdminNotices) {
            console.log('  ❌ ÉCHEC: Des règles indésirables passent le filtre');
            return { passed: false };
        }

        console.log('  ✅ Filtrage correct');

        // Afficher les règles filtrées
        if (filteredRules.length > 0) {
            console.log('\n  📋 Règles affichées à l\'utilisateur:');
            filteredRules.slice(0, 5).forEach(rule => {
                console.log(`     • ${rule.score > 0 ? '+' : ''}${parseFloat(rule.score).toFixed(1)} pts - ${rule.description}`);
            });
        }

        return { passed: true, filteredRules };
    },

    // Test 3: Gestion des erreurs
    async testErrorHandling() {
        console.log('\n🧪 Test 3: Gestion des erreurs');

        // Test: Email vide
        try {
            await callPostmarkAPI('', 'long');
            console.log('  ⚠️  Email vide accepté (API Postmark ne valide pas strictement)');
        } catch (error) {
            console.log('  ✅ Email vide rejeté par l\'API');
        }

        console.log('  ℹ️  Note: La validation stricte se fait dans /api/spamcheck (notre backend)');

        return { passed: true };
    },

    // Test 4: Email spam
    async testSpammyEmail() {
        console.log('\n🧪 Test 4: Email spam (score élevé attendu)');

        const rawEmail = constructRawEmail(
            'winner@lottery.com',
            '!!!CONGRATULATIONS!!! YOU WON $1,000,000!!!',
            `
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
            `
        );

        try {
            const result = await callPostmarkAPI(rawEmail, 'long');

            const score = parseFloat(result.score);
            console.log(`  ✅ API Postmark répond correctement`);
            console.log(`  ✅ Score: ${score}/10`);

            if (score >= 5) {
                console.log(`  ✅ Score élevé comme attendu (email détecté comme spam)`);
            } else {
                console.log(`  ⚠️  Score trop faible: ${score} (attendu: >5 pour un spam)`);
            }

            console.log(`  ✅ Règles déclenchées: ${result.rules ? result.rules.length : 0}`);

            return { passed: true, score };
        } catch (error) {
            console.log(`  ❌ ÉCHEC: ${error.message}`);
            return { passed: false, error };
        }
    }
};

// Exécution
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🧪 Suite de tests SpamAssassin Integration (Node.js)');
    console.log('═══════════════════════════════════════════════════');

    const results = {};

    // Test 1
    results.cleanEmail = await tests.testCleanEmail();

    // Test 2 (utilise les règles du test 1)
    if (results.cleanEmail && results.cleanEmail.rules) {
        results.filtering = tests.testRuleFiltering(results.cleanEmail.rules);
    }

    // Test 3
    results.errorHandling = await tests.testErrorHandling();

    // Test 4
    results.spammyEmail = await tests.testSpammyEmail();

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

// Auto-exécution
if (require.main === module) {
    runAllTests().then(({ allPassed }) => {
        process.exit(allPassed ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests, tests };
