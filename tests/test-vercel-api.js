#!/usr/bin/env node

const https = require('https');

const PROD_URL = 'https://deliverability-analyzer-rp2l.vercel.app';

async function testVercelAPI() {
    console.log('🔍 Test API Vercel /api/spamcheck\n');

    // Email au format RFC 5322 (même format que debug-postmark.js)
    const email = `From: test@example.com
To: recipient@example.com
Subject: Test Email
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
Message-ID: <test123@example.com>
Date: ${new Date().toUTCString()}

<!DOCTYPE html>
<html>
<body>
<h1>Newsletter Test</h1>
<p>Contenu de test pour vérifier l'intégration.</p>
<p><a href="https://example.com/unsubscribe">Se désinscrire</a></p>
</body>
</html>`;

    const data = JSON.stringify({ email, options: 'long' });

    return new Promise((resolve, reject) => {
        const url = new URL(`${PROD_URL}/api/spamcheck`);

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
                console.log(`📡 Status HTTP: ${res.statusCode}\n`);

                if (res.statusCode !== 200) {
                    console.log('❌ Réponse brute:');
                    console.log(responseData.substring(0, 500));
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }

                try {
                    const result = JSON.parse(responseData);

                    if (!result.success) {
                        console.log(`❌ API Error: ${result.message}`);
                        reject(new Error(result.message));
                        return;
                    }

                    console.log('✅ API Vercel fonctionne!\n');
                    console.log(`📊 Score: ${result.score}/10`);
                    console.log(`🏷️  Provider: ${result.provider}`);
                    console.log(`📋 Règles: ${result.rules ? result.rules.length : 0}\n`);

                    // Vérifier le filtrage
                    if (result.rules && result.rules.length > 0) {
                        const rulesAt0 = result.rules.filter(r => parseFloat(r.score) === 0);
                        const adminNotices = result.rules.filter(r =>
                            (r.description || '').includes('ADMINISTRATOR NOTICE')
                        );

                        console.log('🔍 Analyse du filtrage:');
                        console.log(`   • Total règles API: ${result.rules.length}`);
                        console.log(`   • Règles à 0.0 pts: ${rulesAt0.length}`);
                        console.log(`   • ADMINISTRATOR NOTICE: ${adminNotices.length}`);

                        if (rulesAt0.length > 0 || adminNotices.length > 0) {
                            console.log(`\n⚠️  ${rulesAt0.length + adminNotices.length} règles doivent être filtrées côté frontend\n`);
                        } else {
                            console.log('\n✅ Aucune règle à filtrer (ou déjà filtré côté API)\n');
                        }

                        console.log('📋 Top 5 règles retournées:');
                        result.rules.slice(0, 5).forEach((rule, i) => {
                            const score = parseFloat(rule.score);
                            console.log(`   ${i+1}. [${score > 0 ? '+' : ''}${score.toFixed(1)}] ${rule.description.substring(0, 80)}`);
                        });
                    }

                    resolve(result);
                } catch (error) {
                    console.log('❌ Erreur parsing JSON:');
                    console.log(responseData.substring(0, 300));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Erreur réseau:', error.message);
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error('❌ Timeout (>30s)');
            reject(new Error('Timeout'));
        });

        req.write(data);
        req.end();
    });
}

testVercelAPI()
    .then(() => {
        console.log('\n✅ TEST RÉUSSI - API Vercel fonctionnelle!');
        process.exit(0);
    })
    .catch((error) => {
        console.error(`\n❌ TEST ÉCHOUÉ: ${error.message}`);
        process.exit(1);
    });
