require('./node_modules/phantomjs-nodify');
var flow = require('./node_modules/q');
var brraTab = require("webpage").create();
var brraFlow;
var firstUrl = "https://public.brra.bg/CheckUps/Verifications/VerificationPersonOrg.ra";


function
brraTab.onLoadFinished = function (status) {
    brraFlow.resolve(status);
}

var step = function(logic) {
    return function() {
        brraFlow = flow.defer();
        logic.apply(this, arguments);
        return brraFlow.promise;
    }
}

// Start by passing url
flow(firstUrl)

// Open brra.bg landing page
.then(step(function(url) {
        brraTab.open(url);
}))

// Fetch captcha text
.then(function() {
    var captchaUrl = brraTab.evaluate(function() {
        return document.querySelector('[src^="Capt"]').src;
    })
    return downloadAndSolveCaptcha(captchaUrl)
})

// Submit form
.then(step(function(captchaText) {
    brraTab.evaluate(function() {
        var ev = document.createEvent("MouseEvents");
        ev.initEvent("click", true, true);
        document.querySelector('.search_form').querySelector('input[name*="CaptchaControl"]').value = solution;
        document.querySelector('.search_form').querySelector('input[name*="OrganizationName"]').value = mpName;
        document.querySelector('.search_form').querySelector('input[name*="btnSearch"]').dispatchEvent(ev);
    }, captchaText)
}))

// Scrape entries
.then(function() {
    //@todo brra.emit('searchResults', brraTab) instead of continuing the chain
    var entries = brraTab.evaluate(function() {
        var searchWrapper = document.querySelector(".search_results");
        var results = searchWrapper.querySelectorAll('tr')
        var entries = []
        results.forEach(function (row) {
            var company = row.querySelector("a");
            if (company == null) return;
            var title = row.querySelector('td');
            entries.push({
                "title": title,
                "company": company
            })
        });
    })
    return entries;
})
.then(function(entries) {
    console.log(entries)
    phantom.exit()
})

function downloadAndSolveCaptcha(captchaUrl) {
    var captchaReady = flow.defer();
    var captchaTab = require("webpage").create();
    var captchaFlow;
    var nodejs = new NodejsBridge();

    captchaTab.onLoadFinished = function(status) { captchaFlow.resolve(status); }

    var step = function(logic) {
        return function() {
            captchaFlow = flow.defer();
            logic.apply(this, arguments);
            return captchaFlow.promise;
        }
    }
    flow(captchaUrl).
    then(step(function(url) {
        captchaTab.open(url);
    }))
    .then(function() {
        captchaReady.resolve(nodejs.getCaptcha(captchaTab.content))
    })
    return captchaReady.promise();
}


function NodejsBridge() {
    this.tab = require("webpage").create();
    this.endpoint = 'http://localhost:3590/';
}
NodejsBridge.prototype = {
    tab: null,
    endpoint: null,
    getCaptcha: function(data) {
        var loading = flow.defer();
        var self = this;
        self.tab.open(self.endpoint, 'POST', data, function(status) {
            loading.resolve(JSON.parse(self.tab.content));
        });
        return loading.promise()

    }
}