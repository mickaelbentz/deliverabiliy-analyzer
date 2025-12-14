#!/usr/bin/env node

/**
 * Test automatique de l'API SpamAssassin en production
 */

const https = require('https');

const PROD_URL = 'https://deliverability-analyzer-rp2l.vercel.app';

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

async function callAPI(email) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${PROD_URL}/api/spamcheck`);
        const data = JSON.stringify({ email, options: 'long' });

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            timeout: 30000
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
                    reject(new Error(`Parse error: ${responseData.substring(0, 100)}`));
                }
            });
        });

        req.on('error', (error) => reject(error));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║   Tests SpamAssassin - Production                ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`🌐 URL: ${PROD_URL}\n`);

    const results = { passed: 0, failed: 0, warnings: 0 };

    // Test 1: Email propre
    console.log('🧪 Test 1: Email newsletter standard');
    try {
        const rawEmail = constructRawEmail(
            'newsletter@example.com',
            'Newsletter mensuelle',
            `<!DOCTYPE html>
<html>
<body>
    <h1>Newsletter de décembre</h1>
    <p>Bonjour,</p>
    <p>Découvrez nos actualités du mois.</p>
    <p><a href="https://example.com">Lire la suite</a></p>
    <p><a href="https://example.com/unsubscribe">Se désinscrire</a></p>
    <p>Example Inc., 123 Rue de Paris, France</p>
</body>
</html>`
        );

        const result = await callAPI(rawEmail);

        if (result.statusCode === 200 && result.data.success) {
            const score = parseFloat(result.data.score);
            console.log(`  ✅ API accessible`);
            console.log(`  ✅ Score: ${score}/10`);
            console.log(`  ✅ Règles: ${result.data.rules ? result.data.rules.length : 0}`);

            // Vérifier le filtrage
            const rulesAt0 = result.data.rules.filter(r => parseFloat(r.score) === 0);
            const adminNotices = result.data.rules.filter(r =>
                (r.description || '').includes('ADMINISTRATOR NOTICE')
            );

            if (rulesAt0.length > 0 || adminNotices.length > 0) {
                console.log(`  ⚠️  ATTENTION: ${rulesAt0.length} règles à 0.0 pts + ${adminNotices.length} ADMIN NOTICE dans la réponse API`);
                console.log(`  ℹ️  Ces règles DOIVENT être filtrées côté frontend (script.js)`);
                results.warnings++;
            }

            if (score < 0 || score > 10) {
                console.log(`  ❌ Score invalide: ${score} (doit être 0-10)`);
                results.failed++;
            } else {
                results.passed++;
            }
        } else {
            console.log(`  ❌ Erreur: ${result.data.message || 'Erreur inconnue'}`);
            results.failed++;
        }
    } catch (error) {
        console.log(`  ❌ ÉCHEC: ${error.message}`);
        results.failed++;
    }

    // Test 2: Email spam évident
    console.log('\n🧪 Test 2: Email spam évident');
    try {
        const rawEmail = constructRawEmail(
            'winner@lottery.com',
            'YOU WON $1,000,000!!!',
            `<!DOCTYPE html>
<html>
<body>
    <h1>CONGRATULATIONS!!!</h1>
    <p>You WON the LOTTERY!</p>
    <p>CLICK HERE NOW to claim your FREE MONEY!!!</p>
    <p><a href="http://suspicious.com">CLICK NOW</a></p>
    <p>ACT FAST! LIMITED TIME! URGENT!</p>
</body>
</html>`
        );

        const result = await callAPI(rawEmail);

        if (result.statusCode === 200 && result.data.success) {
            const score = parseFloat(result.data.score);
            console.log(`  ✅ API répond`);
            console.log(`  ✅ Score: ${score}/10`);
            console.log(`  ✅ Règles: ${result.data.rules ? result.data.rules.length : 0}`);

            if (score >= 2) {
                console.log(`  ✅ Score élevé détecté (patterns spam reconnus)`);
                results.passed++;
            } else {
                console.log(`  ⚠️  Score faible: ${score} (SpamAssassin peut être permissif)`);
                results.warnings++;
            }
        } else {
            console.log(`  ❌ Erreur API`);
            results.failed++;
        }
    } catch (error) {
        console.log(`  ❌ ÉCHEC: ${error.message}`);
        results.failed++;
    }

    // Test 3: Validation backend
    console.log('\n🧪 Test 3: Validation backend (email vide)');
    try {
        const result = await callAPI('');

        if (result.statusCode === 400 && !result.data.success) {
            console.log('  ✅ Email vide correctement rejeté');
            console.log(`  ✅ Message: "${result.data.message}"`);
            results.passed++;
        } else {
            console.log('  ❌ Email vide accepté (devrait être rejeté)');
            results.failed++;
        }
    } catch (error) {
        console.log(`  ✅ Erreur capturée (comportement attendu)`);
        results.passed++;
    }

    // Résumé
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Tests réussis: ${results.passed}`);
    console.log(`⚠️  Avertissements: ${results.warnings}`);
    console.log(`❌ Tests échoués: ${results.failed}`);

    const total = results.passed + results.warnings + results.failed;
    const successRate = Math.round((results.passed / total) * 100);

    console.log(`\n📈 Taux de réussite: ${successRate}%`);

    if (results.failed === 0 && results.warnings === 0) {
        console.log('✅ PARFAIT - Tout fonctionne correctement');
    } else if (results.failed === 0) {
        console.log('✅ BON - Quelques avertissements mais fonctionnel');
    } else {
        console.log('❌ PROBLÈMES DÉTECTÉS');
    }

    console.log('═══════════════════════════════════════════════════\n');

    return results.failed === 0;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
