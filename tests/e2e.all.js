exports.config = {
    seleniumAddress: 'http://127.0.0.1:4444/wd/hub',

    specs: [
        './e2e/cmdDriver.js',
        './e2e/spec.js'
    ],

    multiCapabilities: [{
        'browserName': 'chrome'
    },{
        'browserName': 'firefox'
    }]
};