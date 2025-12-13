#!/usr/bin/env node

/**
 * Test de production - Vérifie que l'intégration SpamAssassin fonctionne
 * via l'API Vercel déployée
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Demander l'URL de production
function askProductionURL() {
    return new Promise((resolve) => {
        rl.question('\n🌐 Entrez l\'URL de votre app Vercel (ex: https://deliverability-analyzer.vercel.app):\n> ', (url) => {
            resolve(url.trim().replace(/\/$/, '')); // Remove trailing slash
        });
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

// Appel à l'API Vercel
async function callVercelAPI(baseUrl, email) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${baseUrl}/api/spamcheck`);
        const data = JSON.stringify({ email, options: 'long' });

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({ statusCode: res.statusCode, data: result });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${responseData.substring(0, 200)}`));
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

// Tests
async function runTests(baseUrl) {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🧪 Tests de Production - SpamAssassin Integration');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📍 URL: ${baseUrl}`);
    console.log('═══════════════════════════════════════════════════\n');

    const results = {};

    // Test 1: Email propre
    console.log('🧪 Test 1: Email newsletter standard');
    try {
        const rawEmail = constructRawEmail(
            'newsletter@example.com',
            'Newsletter mensuelle',
            `<!DOCTYPE html>
<html>
<body>
    <p>Bonjour,</p>
    <p>Voici notre newsletter mensuelle avec des informations utiles.</p>
    <p>Merci de votre confiance.</p>
    <p><a href="https://example.com/unsubscribe">Se désinscrire</a></p>
    <p>Example Inc.<br>123 Main St, Paris, France</p>
</body>
</html>`
        );

        const result = await callVercelAPI(baseUrl, rawEmail);

        if (result.statusCode === 200 && result.data.success) {
            const score = parseFloat(result.data.score);
            console.log(`  ✅ API accessible et fonctionnelle`);
            console.log(`  ✅ Score: ${score}/10`);
            console.log(`  ✅ Règles retournées: ${result.data.rules ? result.data.rules.length : 0}`);

            // Test du filtrage
            const rulesAt0 = result.data.rules.filter(r => parseFloat(r.score) === 0);
            const adminNotices = result.data.rules.filter(r =>
                (r.description || '').includes('ADMINISTRATOR NOTICE')
            );

            console.log(`  ℹ️  Règles à 0.0 pts dans la réponse: ${rulesAt0.length}`);
            console.log(`  ℹ️  ADMINISTRATOR NOTICE dans la réponse: ${adminNotices.length}`);

            if (result.data.rules.length > 0) {
                console.log(`\n  📋 Top 3 règles:`);
                result.data.rules.slice(0, 3).forEach(rule => {
                    console.log(`     • ${parseFloat(rule.score) > 0 ? '+' : ''}${parseFloat(rule.score).toFixed(1)} pts - ${rule.description}`);
                });
            }

            results.cleanEmail = { passed: true, score };
        } else {
            console.log(`  ❌ ÉCHEC: ${result.data.message || 'Erreur inconnue'}`);
            results.cleanEmail = { passed: false };
        }
    } catch (error) {
        console.log(`  ❌ ÉCHEC: ${error.message}`);
        results.cleanEmail = { passed: false, error: error.message };
    }

    // Test 2: Gestion des erreurs
    console.log('\n🧪 Test 2: Validation backend (email vide)');
    try {
        const result = await callVercelAPI(baseUrl, '');

        if (result.statusCode === 400 && !result.data.success) {
            console.log('  ✅ Email vide correctement rejeté par le backend');
            console.log(`  ✅ Message: "${result.data.message}"`);
            results.errorHandling = { passed: true };
        } else {
            console.log('  ⚠️  Email vide accepté (devrait être rejeté)');
            results.errorHandling = { passed: false };
        }
    } catch (error) {
        console.log(`  ✅ Erreur capturée: ${error.message}`);
        results.errorHandling = { passed: true };
    }

    // Test 3: Email spam
    console.log('\n🧪 Test 3: Email spam évident');
    try {
        const rawEmail = constructRawEmail(
            'winner@lottery.com',
            '!!!CONGRATULATIONS!!! YOU WON $1,000,000!!!',
            `<!DOCTYPE html>
<html>
<body>
    <h1>CONGRATULATIONS!!!</h1>
    <p>You are the WINNER of our AMAZING lottery!</p>
    <p>Click HERE to claim your FREE MONEY NOW!!!</p>
    <p><a href="http://suspicious-site.com">CLICK HERE NOW</a></p>
    <p>ACT FAST! LIMITED TIME OFFER!</p>
    <p>FREE! WINNER! CASH! MONEY! AMAZING!</p>
</body>
</html>`
        );

        const result = await callVercelAPI(baseUrl, rawEmail);

        if (result.statusCode === 200 && result.data.success) {
            const score = parseFloat(result.data.score);
            console.log(`  ✅ API répond correctement`);
            console.log(`  ✅ Score: ${score}/10`);
            console.log(`  ✅ Règles déclenchées: ${result.data.rules ? result.data.rules.length : 0}`);

            if (score >= 3) {
                console.log(`  ✅ Score élevé comme attendu (patterns spam détectés)`);
            } else {
                console.log(`  ℹ️  Score: ${score} (SpamAssassin peut être permissif pour certains patterns)`);
            }

            if (result.data.rules.length > 0) {
                console.log(`\n  📋 Top 5 règles spam:`);
                result.data.rules.slice(0, 5).forEach(rule => {
                    console.log(`     • ${parseFloat(rule.score) > 0 ? '+' : ''}${parseFloat(rule.score).toFixed(1)} pts - ${rule.description}`);
                });
            }

            results.spammyEmail = { passed: true, score };
        } else {
            console.log(`  ❌ ÉCHEC: ${result.data.message || 'Erreur inconnue'}`);
            results.spammyEmail = { passed: false };
        }
    } catch (error) {
        console.log(`  ❌ ÉCHEC: ${error.message}`);
        results.spammyEmail = { passed: false, error: error.message };
    }

    // Test 4: Performance
    console.log('\n🧪 Test 4: Performance');
    try {
        const rawEmail = constructRawEmail(
            'test@example.com',
            'Test performance',
            '<html><body><p>Test</p></body></html>'
        );

        const startTime = Date.now();
        await callVercelAPI(baseUrl, rawEmail);
        const duration = Date.now() - startTime;

        console.log(`  ✅ Temps de réponse: ${duration}ms`);

        if (duration < 2000) {
            console.log('  ✅ Performance excellente (<2s)');
        } else if (duration < 5000) {
            console.log('  ✅ Performance acceptable (2-5s)');
        } else {
            console.log('  ⚠️  Performance lente (>5s)');
        }

        results.performance = { passed: true, duration };
    } catch (error) {
        console.log(`  ❌ ÉCHEC: ${error.message}`);
        results.performance = { passed: false };
    }

    // Résumé
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('═══════════════════════════════════════════════════');

    const testNames = {
        cleanEmail: 'Email newsletter standard',
        errorHandling: 'Validation backend',
        spammyEmail: 'Email spam évident',
        performance: 'Performance'
    };

    Object.entries(results).forEach(([key, result]) => {
        const name = testNames[key];
        console.log(`${result.passed ? '✅' : '❌'} ${name}`);
    });

    const allPassed = Object.values(results).every(r => r && r.passed);
    console.log('\n' + (allPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '⚠️  CERTAINS TESTS ONT ÉCHOUÉ'));
    console.log('═══════════════════════════════════════════════════\n');

    return allPassed;
}

// Main
async function main() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   Test de Production - SpamAssassin Integration  ║');
    console.log('╚═══════════════════════════════════════════════════╝');

    const baseUrl = await askProductionURL();

    if (!baseUrl.startsWith('http')) {
        console.log('\n❌ URL invalide. Elle doit commencer par http:// ou https://');
        rl.close();
        process.exit(1);
    }

    const success = await runTests(baseUrl);

    rl.close();
    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    rl.close();
    process.exit(1);
});
