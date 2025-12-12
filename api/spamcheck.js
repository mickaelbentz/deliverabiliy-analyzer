/**
 * Vercel Serverless Function - SpamAssassin Proxy
 *
 * Cette fonction fait office de proxy vers l'API Postmark SpamCheck
 * pour éviter les problèmes CORS et permettre l'intégration de SpamAssassin
 * dans l'analyseur d'emails côté client.
 *
 * Endpoint: /api/spamcheck
 * Method: POST
 * Body: { email: string, options: 'long' | 'short' }
 */

export default async function handler(req, res) {
    // Configuration CORS pour permettre les requêtes depuis le frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Gestion de la requête OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Validation de la méthode HTTP
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method Not Allowed. Use POST.'
        });
    }

    // Validation du body
    const { email, options } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request. "email" field is required and must be a string.'
        });
    }

    if (email.length > 1000000) { // Limite de 1MB
        return res.status(400).json({
            success: false,
            message: 'Email too large. Maximum size is 1MB.'
        });
    }

    // Options par défaut
    const spamOptions = options || 'long';

    try {
        // Appel à l'API Postmark SpamCheck
        const spamCheckResponse = await fetch('https://spamcheck.postmarkapp.com/filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                options: spamOptions
            })
        });

        // Vérification de la réponse
        if (!spamCheckResponse.ok) {
            throw new Error(`Postmark API returned status ${spamCheckResponse.status}`);
        }

        const result = await spamCheckResponse.json();

        // Si l'API Postmark retourne une erreur
        if (result.success === false) {
            return res.status(500).json({
                success: false,
                message: result.message || 'SpamAssassin check failed'
            });
        }

        // Retour du résultat avec métadonnées
        return res.status(200).json({
            success: true,
            score: result.score,
            rules: result.rules || [],
            report: result.report || '',
            timestamp: new Date().toISOString(),
            provider: 'Postmark SpamCheck (SpamAssassin)'
        });

    } catch (error) {
        console.error('SpamCheck API Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to check spam score. Please try again later.',
            error: error.message
        });
    }
}
