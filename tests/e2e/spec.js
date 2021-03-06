browser.ignoreSynchronization = true;
var pageObject = require('./pageObject.js')
var BitwiseCmdPage = pageObject.BitwiseCmdPage;

var By = protractor.By;
var driver = browser.driver;
var appUrl = browser.params.appUrl || 'http://localhost:63342/BitwiseCmd/src/#clear';
var sutPage = new BitwiseCmdPage(driver, appUrl);

describe('when application starts', function() {
    it('should have title', function() {
        sutPage.goToApp().then(function() {
            expect(driver.getTitle()).toEqual('BitwiseCmd');
        });
    });

    it('should have no errors upon loading', function() {
        return sutPage.shouldHaveNoErrors();
    });

    it('should execute clear command', function() {
        sutPage.clearResults().then(function () {
            return driver.findElements(By.css('.result')).then(function(list) {
                expect(list.length).toBe(0, "There should be no results after clear");
            });
        });
    });

    it('should execute list of commands without errors', function() {
        sutPage.goToApp()
            .then(function() { return sutPage.executeExpression('clear')})
            .then(function() { return sutPage.executeExpression('1')})
            .then(function() { return sutPage.executeExpression('1|2')})
            .then(function() { return sutPage.executeExpression('1^2')})
            .then(function() { return sutPage.executeExpression('1^0b10')})
            .then(function() { return sutPage.executeExpression('0x1>>>0xf')})
            .then(function() { return sutPage.executeExpression('0x1 0xf')})
            .then(function() { return sutPage.executeExpression('0x1 | 0xf')})
            .then(function() { return sutPage.executeExpression('0x1 ^ 123')})
            .then(function() { return sutPage.executeExpression('1|2&3|5 |5')})
            .then(function() { return sutPage.executeExpression('dark')})
            .then(function() { return sutPage.executeExpression('light')})
            .then(function() { return sutPage.executeExpression('midnight')})
            .then(function() { return sutPage.executeExpression('guid')})
            .then(function() { return sutPage.shouldHaveNoErrors(); });
    });

    it('should execute list of numbers', function() {
        assertOperation('3 0xf 0b101',
            [{ label: '3', bin:'00000011', other: '0x3'},
             { label: '0xf', bin:'00001111', other: '15'},
             { label: '5', bin: '00000101', other: '0x5' }]);
    });

    it('should do a shift operation', function() {

        return assertOperation('1<<1',
            [{ label: '1', bin:'00000001', other: '0x1'},
                { sign:'<<1', label: '2', bin:'00000010', other: '0x2'}])
    });

    it('should do a ignore sign RIGHT shift operation', function() {

        return assertOperation('-1>>>1',
            [{ label: '-1', bin:'11111111111111111111111111111111', other: '-0x1'},
             { sign: '>>>1', label: '2147483647', bin:'01111111111111111111111111111111', other: '0x7fffffff'}])
    });

    it('should do NOT operation', function() {

        return assertOperation('~1',
            [{ sign: '~', label: '1', bin:'00000000000000000000000000000001', other: '0x1'},
             { sign: '=', label: '-2', bin:'11111111111111111111111111111110', other: '-0x2'}])
    });

    it('should execute multiple expressions from hash arguments', function() {
        return sutPage.goToApp("16,15||16&15")
            .then(function() { return driver.navigate().refresh(); })
            .then(function() { return sutPage.shouldHaveNoErrors(); })
            .then(function() {
                return assertMultipleExpressionResults([
                    //16&15
                    [{ label: '16', bin:'00010000', other: '0x10'},
                        { sign:'&', label: '15', bin:'00001111', other: '0xf'},
                        { sign:'=', label: '0', bin:'00000000', other: '0x0'}],

                    //16 15
                    [{ label: '16', bin:'00010000', other: '0x10'},
                        { label: '15', bin:'00001111', other: '0xf'}]
                ])
            })
    });

    it('should do OR operation', function() {

        return assertOperation('1|2',
               [{ label: '1', bin:'00000001', other: '0x1'},
                {  sign: '|', label: '2', bin:'00000010', other: '0x2'},
                { sign: '=', label: '3', bin:'00000011', other: '0x3'}])
    });

    it('should do multiple operand expression', function() {
// actual   { sign: '', label: '1', bin: '00000000000000000000000000000001', other: '0x1' }
// expected { sign: '', label: '1', bin: '0000000000000000000000000000001', other: '0x1' }
        return assertOperation(
            '1|2|4<<0x1|~2',
            [   
                [         '1',    '00000000000000000000000000000001',  '0x1'],
                [    '|', '2',    '00000000000000000000000000000010',  '0x2'],
                [    '=', '3',    '00000000000000000000000000000011', '0x3'],
                [    '|', '4',    '00000000000000000000000000000100', '0x4'],
                [    '=', '7',    '00000000000000000000000000000111', '0x7'],
                [ '<<0x1','0xe',  '00000000000000000000000000001110', '14' ],
                [     '|', '~2',  '11111111111111111111111111111101',   '-3'],
                [     '=', '-1',  '11111111111111111111111111111111', '-0x1']
            ]);
    });

    it('should support nested not operations', function() {
        return assertOperation(
            '~3|~213&~12^~223',
            [
                ['~',  '3',	    '00000000000000000000000000000011',	'0x3'],
                ['=',  '-4',    '11111111111111111111111111111100',	'-0x4'],
                ['|',  '~213',  '11111111111111111111111100101010',	'-214'],
                ['=',  '-2',    '11111111111111111111111111111110',	'-0x2'],
                ['&',  '~12',	'11111111111111111111111111110011',	'-13'],
                ['=',  '-14',	'11111111111111111111111111110010',	'-0xe'],
                ['^',  '~223',  '11111111111111111111111100100000',	'-224'],
                ['=',  '210',   '00000000000000000000000011010010',	'0xd2']
            ]
        )
    })

    it('should do or for binary numbers', function() {
        return assertOperation('0b10|0b11', 
            [[    "2", "00000010", "0x2"],
             ["|", "3", "00000011", "0x3"],
             ["=", "3", "00000011", "0x3"]]
        );
    })

    it('should do prefer hex result', function() {

        return assertOperation('1|0x2',
            [{ label: '1', bin:'00000001', other: '0x1'},
                { sign: '|', label: '0x2', bin:'00000010', other: '2'},
                { sign: '=', label: '0x3', bin:'00000011', other: '3'}])
    });


    // TODO: temporary disabled due to false positive on prod
    xit('should create hashlink', function() {
        var expression = '1|0x2';
        var expected = [{ label: '1', bin:'00000001', other: '0x1'},
            { sign: '|', label: '0x2', bin:'00000010', other: '2'},
            { sign: '=', label: '0x3', bin:'00000011', other: '3'}];

        return assertOperation(expression, expected).then(function(){
            return driver.findElement(By.css('.hashLink'));
        }).then(function(el) {
            return el.getAttribute('href');
        }).then(function(hrefUrl) {
            console.log('haslink url: ' + hrefUrl);
            return driver.get(hrefUrl); // TODO: temp solution. Need to implement better tracking handling logic
        }).then(function() {
            return driver.findElements(By.css('.result'));
        }).then(function(list) {
            expect(list.length).toBeGreaterThan(0);
            return assertExpressionResult(expected);
        });

    });

    it('should emphasize bytes', function() {

        sutPage.goToApp()
            .then(function() { return sutPage.executeExpression('1')})
            .then(function() {
                return assertExpressionResult([{ label: '1', bin:'00000001', other: '0x1'}])
            })
            .then(function() { return sutPage.executeExpression('clear')})
            .then(function() { return sutPage.executeExpression('em')})
            .then(function() { return sutPage.shouldHaveNoErrors(); })
            .then(function() { return sutPage.executeExpression('1 3')})
            .then(function() {
                return assertExpressionResult([{ label: '1', bin:'01', other: '0x1'}, { label: '3', bin:'11', other: '0x3'}])
            });
    });
});

describe('interaction with results', function() {
    it('should flip bits', function () {

        // Given: 0x2a 00101010 42
        // Expected: 0x6a 01101010 106

        sutPage.goToApp()
            .then(function() { return sutPage.executeExpression('0x2a')})
            .then(function() { assertExpressionResult([{ label: "0x2a", bin: '00101010', other: '42' }]); })
            .then(function() { return flipBit(2); })
            .then(function() { return assertExpressionResult([{ label: "0x6a", bin: '01101010', other: '106' }]); })
            .then(function() { return flipBit(6); })
            .then(function() { return assertExpressionResult([{ label: "0x6e", bin: '01101110', other: '110' }]); });
    })
});

function assertMultipleExpressionResults(array) {
    return sutPage.getAllResults().then(function(results){
        var all= null, cur;
        for(var i=0; i<results.length;i++) {
            var expected = array[i];
            cur = results[i].shouldBe(expected);
            all = all == null ? cur : all.then(cur);
        }

        return all;
    });
}

function assertExpressionResult(expected) {
    return sutPage.getLasExpressionResult().then(function(result){
       result.shouldBe(expected);
    });
}

function assertOperation(op, expected) {
    console.log('\n' + op);
    return sutPage.executeExpression(op)
        .then(function() { return sutPage.shouldHaveNoErrors(); })
        .then(function() {
            return assertExpressionResult(expected)
        });
}

function flipBit(bitNumber) {
    return driver.findElements(By.css('.flipable'))
        .then(function(rows) {
            var bitElemet = rows[bitNumber-1]; // Flip 2nd bit;
            return bitElemet.click();
        });
}