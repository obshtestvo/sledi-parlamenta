require('./node_modules/phantomjs-nodify');
var AopShort = require('./crawler/short.js')
var fs = require('fs');
var settings = require('./settings.secret.js');
var argv = require('optimist')
    .usage('Crawls aop.bg and extracts state orders for all the provided businesses.\nUsage: phantomjs --ignore-ssl-errors=true run.js')
    .options('i', {
        demand: true,
        alias: 'input',
        description: 'File or pipe path containing one business name on each line to be processed'
    })
    .options('t', {
        alias: 'temp',
        default: '/var/tmp',
        description: 'Temporary directory to store manual captchas'
    }).wrap(60)
    .argv;

var input = fs.open(argv.input, "r")
while (business = input.readLine()) {
    var aop = new AopShort(business, settings);
    aop.run();
    aop.on('searchresults', function() {
//        var entries = aop.tab.evaluate(function() {
//            return document.querySelector(".up_menu_link").textContent.trim()
//        })
//        console.log(JSON.stringify(entries))
        console.log(aop.tab.content)
    })
}