// Debug regex patterns
const testStrings = [
    '30 שכיבות סמיכה',
    'רצתי 5 קילומטר'
];

const patterns = [
    { name: 'X Y pattern', regex: /^(\d+)\s+([^\s]+(?:\s+[^\s]+)*)/u },
    { name: 'Running pattern', regex: /רצתי\s+(\d+(?:\.\d+)?)\s*(?:קילומטר|ק"מ|קמ)/u }
];

testStrings.forEach(str => {
    console.log(`\nTesting: "${str}"`);
    patterns.forEach(pattern => {
        const match = str.match(pattern.regex);
        console.log(`${pattern.name}: ${match ? 'MATCH - ' + JSON.stringify(match) : 'NO MATCH'}`);
    });
});