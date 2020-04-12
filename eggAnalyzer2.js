// Queremos representar un lenguaje que contiene la siguiente gramatica:
// V  {expression, apply}

// S = expression

// P = {
//    expression: STRING
//             | NUMBER
//             | WORD apply 

//    apply: ϵ | '(' (expression ',')* expression? ')' apply
// }

// Σ = {
//    WHITES = /^(\s|#.*)*/;
//    STRING = /"((?:[^"\\]|\\.)*)"/;
//    NUMBER = /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/;
//    WORD   = /([^\s(),"]+)/;
// }

class Grammmar{
    /**
     * 
     * @param {Map<Number,String>} V Map que contiene los nombres de los no Terminales relacionados con un entero
     * @param {Number} S Id entero que indica cual es el no terminal de inicio 
     * @param {Map<Number,Function} P Reglas de producción de la gramatica.
     * @param {Map<String,RegExp>} E Alfabeto de la gramatica que representa los posibles valores de los no terminales.  
     */
    constructor(V, S, P, E){
        this._V = V;
        this._S = S;
        this._P = P;
        this._E = E;
    }


}

class EggAnalyzer{

    constructor(){
        this.G = (function(){
            
            V = {
                0 : "EXPRESSION",
                1 : "APPLY"
            }
            S = 0;

            P = {
                0 : (str) => {},
                1 : (str) => {}
            }
            
            E = {
                STRING : /"((?:[^"\\]|\\.)*)"/,
                NUMBER : /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/,
                WORD   : /([^\s(),"]+)/
            };
            
            return new Grammmar(V,S,P,E);
        })()
    }


}


console.log(parse("+(a, 10)"));