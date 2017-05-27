import Operand from './expression/operand';

var expression = {
        factories:[],
        canParse: function(string) {
            var trimmed = string.replace(/^\s+|\s+$/, '');
            var i = this.factories.length-1;
            for(;i>=0;i--) {
                if(this.factories[i].canCreate(trimmed) === true){
                    return true;
                }
            }
            return false;
        },
        parse: function(string) {
            var trimmed = string.replace(/^\s+|\s+$/, '');
            var i = 0, l = this.factories.length, factory;

            for(;i<l;i++) {
                factory = this.factories[i];

                if(factory.canCreate(trimmed) == true){
                    return factory.create(trimmed);
                }
            }

            return null;
        },
        parseOperand: function(input) {
            return Operand.parse(input);
        },
        createOperand: function(number, kind) {
            return Operand.create(number, kind);
        },
        addFactory: function(factory) {
          this.factories.push(factory);
        }
    };

    // List of numbers
    expression.addFactory({
        regex: /^(-?(?:\d+|0x[\d,a-f]+|0b[0-1])\s?)+$/,
        canCreate: function(string) {
            return this.regex.test(string);
        },
        create: function (string) {
            var matches = this.regex.exec(string),
                numbers = [],
                input = matches.input;

            input.split(' ').forEach(function(n){
                if(n.trim().length > 0) {
                    numbers.push(Operand.parse(n.trim()));
                }
            });

            return new ListOfNumbersExpression(input, numbers);
        }
    });

    // Not Expression
    expression.addFactory({
        regex: /^(~)(-?[b,x,a-f,0-9]+)$/,
        canCreate: function(string) {
            return this.regex.test(string);
        },
        create: function (string) {
            var matches = this.regex.exec(string),
                operand = Operand.parse(matches[2]);

            return new SingleOperandExpression(matches.input, operand, matches[1]);
        }
    });

    // Multiple operands expression
    expression.addFactory({
        fullRegex: /^((<<|>>|>>>|\||\&|\^)?(-?([b,x,a-f,0-9]+)))+$/,
        regex: /(<<|>>|>>>|\||\&|\^)?(-?([b,x,a-f,0-9]+))/g,
        canCreate: function(string) {
            this.fullRegex.lastIndex = 0;
            return this.fullRegex.test(this.normalizeString(string));
        },
        create: function (string) {
            var m, operands = [],
                normalizedString = this.normalizeString(string);

            while ((m = this.regex.exec(normalizedString)) != null) {
               operands.push(this.parseMatch(m));
            }

            return new MultipleOperandsExpression(normalizedString, operands)
        },
        parseMatch: function (m) {
            var input = m[0],
                sign = m[1],
                num = m[2];

            var op = Operand.parse(num);
            if(sign == null) {
                return op;
            } else {
                return new SingleOperandExpression(input, op, sign);
            }
        },
        normalizeString: function (string) {
            return string.replace(/\s+/g,'');
        }
    });

// Expressions like ~1
export class SingleOperandExpression {
    constructor(expressionString, operand, sign) {
        this.expressionString = expressionString;
        this.operand1 = operand;
        this.sign = sign;
    }
    
    apply(value) {
          var str = '';
          if(this.sign == '~'){
              str = '~' + this.operand1.value;
          } else {
              str = value + this.sign + this.operand1.value
          }

         console.log('eval:' + str + " = " + eval(str), Operand.create(eval(str), this.operand1.kind));

         const resultValue = eval(str);
         return Operand.create(resultValue, this.operand1.kind);
    };

    isShiftExpression() {
        return this.sign.indexOf('<') >= 0 || this.sign.indexOf('>')>= 0;
    };

    toString() {
        return this.sign + this.operand1.toString();
    }
}

// Expression like 1|2 or 4^5
export class TwoOperandExpression {
    constructor(expressionString, operand1, operand2, sign) {
        this.expressionString = expressionString;
        this.operand1 = operand1;
        this.operand2 = operand2;
        this.sign = sign;
    }
}

export class MultipleOperandsExpression {
    constructor(expressionString, expressions) {
        this.expressionString = expressionString;
        this.expressions = expressions;
    }
}

export class ListOfNumbersExpression {
    constructor(expressionString, numbers) {
        this.expressionString = expressionString;
        this.numbers = numbers;
        this.maxBitsLegnth = numbers.map(n => n.lengthInBits).reduce((n , c) => n >= c ? n : c, 0);
    }

    toString() {
        return this.numbers.map(n => n.value.toString()).join(' ');
    }
}

export class Expression {
    toString() {
        return this.expressionString ? "Expression: " + this.expressionString : this.toString();
    };
}
  
export var parser = expression;


export class Parser {
    constructor(input, pos) {
        this.input = input;
        this.pos = pos || 0;
        this.buffer = [];
    }

    parse() {
        console.log(this.input.length);
        while(this.pos<this.input.length) {
            this.buffer.push(this.input[this.pos]);
            this.pos++;
        }
        console.log('exit');
    }
}