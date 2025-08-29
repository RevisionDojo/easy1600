const fs = require('fs');
const data = JSON.parse(fs.readFileSync('../oneprep_sat_suite_questionbank.json', 'utf8'));
console.log('Top level keys:', Object.keys(data));
console.log('Has questions array:', !!data.questions);
console.log('Data is array:', Array.isArray(data));
if (data.questions) console.log('Questions length:', data.questions.length);
if (Array.isArray(data)) console.log('Data array length:', data.length);
