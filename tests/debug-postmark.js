#!/usr/bin/env node

const https = require('https');

// Test direct de l'API Postmark
async function testPostmark() {
    console.log('🔍 Test direct API Postmark\n');

    // Email simple au format texte brut (RFC 5322)
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
<p>Hello World</p>
</body>
</html>`;

    const data = JSON.stringify({ email, options: 'long' });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'spamcheck.postmarkapp.com',
            port: 443,
            path: '/filter',
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
                console.log(`Status: ${res.statusCode}\n`);

                try {
                    const result = JSON.parse(responseData);
                    console.log('✅ Réponse JSON valide:\n');
                    console.log(`Score: ${result.score}/10`);
                    console.log(`Report: ${result.report ? 'Présent' : 'Absent'}`);
                    console.log(`Rules: ${result.rules ? result.rules.length : 0}\n`);

                    if (result.rules && result.rules.length > 0) {
                        console.log('📋 Top 5 règles:');
                        result.rules.slice(0, 5).forEach((rule, i) => {
                            console.log(`${i+1}. [${rule.score}] ${rule.description}`);
                        });
                    }

                    resolve(result);
                } catch (error) {
                    console.log('❌ Erreur de parsing JSON:');
                    console.log(responseData.substring(0, 500));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Erreur requête:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

testPostmark()
    .then(() => {
        console.log('\n✅ Test réussi!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test échoué:', error.message);
        process.exit(1);
    });
