#!/usr/bin/env node

/**
 * Test simple - Validation de la logique de filtrage
 * Test uniquement le code de filtrage des règles (pas besoin d'API)
 */

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║   Test de Filtrage - SpamAssassin Rules          ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

// Simulation de règles SpamAssassin retournées par l'API
const mockRules = [
    {
        score: "0.1",
        description: "BODY: Message only has text/html MIME parts",
        rule: "MIME_HTML_ONLY"
    },
    {
        score: "0.1",
        description: "Missing Message-Id header",
        rule: "MISSING_MID"
    },
    {
        score: "0.0",
        description: "ADMINISTRATOR NOTICE: The query to URIBL was blocked. See http://wiki.apache.org/spamassassin/DnsBlocklists#dnsbl-block for more information. [URIs: fonts.googleapis.com]",
        rule: "URIBL_BLOCKED"
    },
    {
        score: "0.0",
        description: "ADMINISTRATOR NOTICE: The query to dbl.spamhaus.org was blocked due to usage of an open resolver. See https://www.spamhaus.org/returnc/pub/ [URIs: fonts.googleapis.com]",
        rule: "DBL_BLOCKED"
    },
    {
        score: "0.0",
        description: "ADMINISTRATOR NOTICE: The query to zen.spamhaus.org was blocked due to usage of an open resolver. See https://www.spamhaus.org/returnc/pub/ [URIs: sinch.com]",
        rule: "ZEN_BLOCKED"
    },
    {
        score: "-0.1",
        description: "DKIM signature valid",
        rule: "DKIM_VALID"
    }
];

console.log('📋 Règles simulées (comme retournées par l\'API Postmark):');
console.log(`   Total: ${mockRules.length} règles\n`);

mockRules.forEach((rule, i) => {
    const score = parseFloat(rule.score);
    console.log(`   ${i + 1}. ${score > 0 ? '+' : ''}${score.toFixed(1)} pts - ${rule.description.substring(0, 80)}${rule.description.length > 80 ? '...' : ''}`);
});

// Logique de filtrage (copiée de script.js ligne 274-285)
console.log('\n🔧 Application du filtre intelligent...\n');

const filteredRules = mockRules.filter(rule => {
    const ruleScore = parseFloat(rule.score);
    const description = rule.description || '';

    // Exclure les règles à 0.0 pts
    if (ruleScore === 0) {
        console.log(`   ❌ Filtré (0.0 pts): ${rule.rule}`);
        return false;
    }

    // Exclure les warnings serveur (ADMINISTRATOR NOTICE)
    if (description.includes('ADMINISTRATOR NOTICE')) {
        console.log(`   ❌ Filtré (ADMIN NOTICE): ${rule.rule}`);
        return false;
    }

    console.log(`   ✅ Conservé: ${rule.rule}`);
    return true;
});

// Tri par score décroissant
const sortedRules = filteredRules.sort((a, b) =>
    Math.abs(parseFloat(b.score)) - Math.abs(parseFloat(a.score))
);

// Prendre les 5 premières
const topRules = sortedRules.slice(0, 5);

console.log('\n═══════════════════════════════════════════════════');
console.log('📊 RÉSULTATS');
console.log('═══════════════════════════════════════════════════\n');

console.log(`Règles avant filtrage: ${mockRules.length}`);
console.log(`Règles après filtrage: ${filteredRules.length}`);
console.log(`Règles affichées (top 5): ${topRules.length}\n`);

// Vérifications
const tests = {
    'Aucune règle à 0.0 pts': !filteredRules.some(r => parseFloat(r.score) === 0),
    'Aucun ADMINISTRATOR NOTICE': !filteredRules.some(r => (r.description || '').includes('ADMINISTRATOR NOTICE')),
    'Tri par score décroissant': topRules.every((rule, i) => {
        if (i === 0) return true;
        return Math.abs(parseFloat(rule.score)) <= Math.abs(parseFloat(topRules[i - 1].score));
    }),
    'Maximum 5 règles': topRules.length <= 5
};

console.log('✅ Tests de validation:');
Object.entries(tests).forEach(([name, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${name}`);
});

console.log('\n📋 Règles qui seront affichées à l\'utilisateur:\n');
topRules.forEach((rule, i) => {
    const score = parseFloat(rule.score);
    console.log(`   ${i + 1}. ${score > 0 ? '+' : ''}${score.toFixed(1)} pts - ${rule.description}`);
});

const allPassed = Object.values(tests).every(t => t);

console.log('\n═══════════════════════════════════════════════════');
console.log(allPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
console.log('═══════════════════════════════════════════════════\n');

console.log('💡 Conclusion:');
if (allPassed) {
    console.log('   La logique de filtrage fonctionne correctement.');
    console.log('   Les utilisateurs ne verront que les règles pertinentes.');
    console.log('   Les warnings serveur à 0.0 pts sont bien filtrés.\n');
} else {
    console.log('   ⚠️  Des problèmes ont été détectés dans le filtrage.\n');
}

process.exit(allPassed ? 0 : 1);
