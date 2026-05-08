const fs = require('fs');
const pageJS = fs.readFileSync('src/app/transactions/page.js', 'utf8');

const txMapStart = pageJS.indexOf('transactions.map((tx) => {');
const txMapEnd = pageJS.indexOf(')}', pageJS.indexOf('</motion.div>', txMapStart)) + 2;

const pieChartStart = pageJS.indexOf('className={styles.chartsGrid}');
const pieChartEnd = pageJS.indexOf('</motion.div>', pageJS.indexOf('</motion.div>', pageJS.indexOf('</motion.div>', pieChartStart))) + 13;

console.log("Found transaction map length:", txMapEnd - txMapStart);
console.log("Found pie chart length:", pieChartEnd - pieChartStart);
