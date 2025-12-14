#!/usr/bin/env node

/**
 * Test automatique - Détecte l'URL de production et lance les tests
 */

const https = require('https');

// Tentative d'URL basée sur le nom du repo
const POSSIBLE_URLS = [
    'https://deliverability-analyzer-rp2l.vercel.app',
    'https://deliverabiliy-analyzer.vercel.app',
    'https://deliverability-analyzer.vercel.app',
    'https://email-deliverability-checker.vercel.app'
];

// Construction d'un email RFC 5322 (même format que script.js)
function constructRawEmail(from, subject, html) {
    const headers = [
        `From: ${from}`,
        `To: recipient@example.com`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Date: ${new Date().toUTCString()}`
    ].join('\r\n');

    return `${headers}\r\n\r\n${html}`;
}

// Vérifier si une URL est accessible
async function checkURL(url) {
    return new Promise((resolve) => {
        const testUrl = new URL(url);

        const options = {
            hostname: testUrl.hostname,
            port: 443,
            path: '/',
            method: 'HEAD',
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// Appel à l'API
async function callAPI(baseUrl, email) {
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
                    console.log(`\n  🔍 Debug - Status: ${res.statusCode}`);
                    console.log(`  🔍 Debug - Response (first 500 chars):\n${responseData.substring(0, 500)}\n`);
                    reject(new Error(`Parse error: ${error.message}`));
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

// Test principal
async function testEmail(baseUrl) {
    console.log(`\n🧪 Test: Email newsletter standard`);

    const rawEmail = constructRawEmail(
        'newsletter@example.com',
        'Newsletter mensuelle',
        `<!DOCTYPE html>
<html>
<body>
    <p>Bonjour,</p>
    <p>Voici notre newsletter mensuelle.</p>
    <p><a href="https://example.com/unsubscribe">Se désinscrire</a></p>
</body>
</html>`
    );

    try {
        const startTime = Date.now();
        const result = await callAPI(baseUrl, rawEmail);
        const duration = Date.now() - startTime;

        if (result.statusCode === 200 && result.data.success) {
            const score = parseFloat(result.data.score);

            console.log(`  ✅ API répond (${duration}ms)`);
            console.log(`  ✅ Score: ${score}/10`);
            console.log(`  ✅ Provider: ${result.data.provider}`);
            console.log(`  ✅ Règles: ${result.data.rules ? result.data.rules.length : 0}`);

            // Vérifier le filtrage
            if (result.data.rules && result.data.rules.length > 0) {
                const rulesAt0 = result.data.rules.filter(r => parseFloat(r.score) === 0).length;
                const adminNotices = result.data.rules.filter(r =>
                    (r.description || '').includes('ADMINISTRATOR NOTICE')
                ).length;

                console.log(`\n  📋 Analyse du filtrage:`);
                console.log(`     • Total règles retournées par API: ${result.data.rules.length}`);
                console.log(`     • Règles à 0.0 pts: ${rulesAt0} ${rulesAt0 > 0 ? '⚠️  (devraient être filtrées côté frontend)' : '✅'}`);
                console.log(`     • ADMINISTRATOR NOTICE: ${adminNotices} ${adminNotices > 0 ? '⚠️  (devraient être filtrées côté frontend)' : '✅'}`);

                console.log(`\n  📋 Top 3 règles:`);
                result.data.rules.slice(0, 3).forEach(rule => {
                    const ruleScore = parseFloat(rule.score);
                    console.log(`     • ${ruleScore > 0 ? '+' : ''}${ruleScore.toFixed(1)} pts - ${rule.description.substring(0, 80)}`);
                });
            }

            return true;
        } else {
            console.log(`  ❌ Erreur: ${result.data.message || 'Erreur inconnue'}`);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ Échec: ${error.message}`);
        return false;
    }
}

// Main
async function main() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     Test Automatique - SpamAssassin Integration  ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('🔍 Détection de l\'URL de production...\n');

    let productionUrl = null;

    for (const url of POSSIBLE_URLS) {
        process.stdout.write(`   Essai: ${url} ... `);
        const isAccessible = await checkURL(url);

        if (isAccessible) {
            console.log('✅ Accessible');
            productionUrl = url;
            break;
        } else {
            console.log('❌ Non accessible');
        }
    }

    if (!productionUrl) {
        console.log('\n❌ Aucune URL de production trouvée.');
        console.log('\n💡 Solutions:');
        console.log('   1. Exécutez: node tests/test-production.js');
        console.log('   2. Et entrez manuellement votre URL Vercel');
        process.exit(1);
    }

    console.log(`\n✅ URL détectée: ${productionUrl}`);
    console.log('═══════════════════════════════════════════════════');

    const success = await testEmail(productionUrl);

    console.log('\n═══════════════════════════════════════════════════');
    console.log(success ? '✅ TEST RÉUSSI - Intégration fonctionnelle' : '❌ TEST ÉCHOUÉ');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});
