// Queremos representar un lenguaje que contiene la siguiente gramatica:
// V  {expression, apply}
//
// S = expression
// 
//	P = { //up to v1.2.0
//		expression: (STRING | NUMBER | WORD) apply
//		apply : ϵ  | LP (expression,)* expression? RP apply 
// }
//
//
// Σ = { //up to v1.1.0
//		WHITES 	: /((\s)|((#|;).*))+/,
//		LP		: /([(]|{|\[)/,
//		RP		: /([)]|}|\])/,
//		COMMA	: /,/,
//		STRING 	: /"((?:[^"\\]|\\.)*)"/,
//		NUMBER 	: /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/,
//		WORD   	: /([^{}()[],"#\s]+)/,
// }
// NOTA: Es muy importante que esta Gramatica sea LL para poder codificarla

class EggParserSyntaxException extends SyntaxError{
	constructor(errorMsg,data){
		super(errorMsg);
		this.data = data;
	}
}


class Grammmar{
    /**
     * @param {Map<Number,String>} V Map que contiene los nombres de los no Terminales relacionados con un entero
     * @param {Number} S Id entero que indica cual es el no terminal de inicio 
     * @param {Map<Number,Function} P Reglas de producción de la gramatica.
     * @param {Map<String,RegExp>} E Alfabeto de la gramatica que representa los posibles valores de los no terminales.
     */
    constructor(V, S, P, E, IGNORE = ["WHITES"]){
		const self = this;

		this.IGNORE = IGNORE;
        this.V = V;
		this.S = S;
		this.E = E;
		this.P = [];
		for(const ele in P)
			this.P[ele] = function(...args){
				return P[ele].call(self, ...args);
			};
		//Object.defineProperty(this,'nextToken', {get :function(){return this.tokens[this.lastToken++]}});
	}
	start(program){
		this.lastToken = 0;
		this.tokens = this.tokenize(program);
		let initRule = this.V[this.S];
		return this.P[initRule](this.nextToken());
	};

	tokenize(program){
		let tokens = [];
		let lastIndex = 0;
		let match;
		let type;
		do{
			for(const NT in this.E){
				match = null;
				this.E[NT].lastIndex = lastIndex;
				type = NT;
				if( match = this.E[NT].exec(program) )
					break;
			}
			if(match == null){
				tokens.push({"match": program.slice(lastIndex), "type": "ERROR"});
				break;
			}else if(!(type in this.IGNORE)){
				lastIndex += match[0].length;
				tokens.push({"match": match, "type": type });
			}							
		}while(lastIndex != program.length);
		tokens.push({"match": "", "type": "END"});
		return tokens;
	};

	nextToken(){
		return this.tokens[this.lastToken == this.tokens.size-1 ? this.tokens.size-1 : this.lastToken++];
	}
	
}

class EggParser{
	/**
	* @param {Regex} [ignoreContent = /\s/] Expresión regular que representa el alfabeto a ir ignorando (de modo que no produzca error)
     */
    constructor(){
        this.G = (function(){
            let V = {
                0 : "EXPRESSION",
                1 : "APPLY"
            }
            let S = 0;
			
			let E = {
				WHITES 	: /((\s)|((#|;).*))+/y,
				LP		: /([(]|{|\[)/y,
				RP		: /([)]|}|\])/y,
				COMMA	: /,/y,
                STRING 	: /"((?:[^"\\]|\\.)*)"/y,
                NUMBER 	: /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/y, /*/^\d+\b/*/
				WORD   	: /([^{}(),"#\s]+)/y,
            };
			
			let P = {
                EXPRESSION : function(nextToken) { //RECORDAR que esta regla era del estilo: (STRING | NUMBER | WORD) apply (y por eso al final la llamada a la función que trata la otra regla 'apply')
					let expr;
					if( nextToken.type == "WHITES")
						return this.P["EXPRESSION"](this.nextToken());
					else{
						if (nextToken.type == "STRING")//match = E["STRING"].exec(program) ) 
							expr = {type: "value", value: nextToken.match[1]};
						else if (nextToken.type == "NUMBER") 
							expr = {type: "value", value: Number(nextToken.match[0])};
						else if (nextToken.type == "WORD")
							expr = {type: "word", name: nextToken.match[0]};
						else  
							throw new EggParserSyntaxException(`Unexpected syntax on EXPRESSION: ${nextToken.match[0]} ...`,{expr:expr,rest:nextToken.match[0]});
						return this.P["APPLY"](this.nextToken(),expr); 
					}
					//
				},
                APPLY : function(nextToken, expr){
					if( nextToken.type == "WHITES" ) return this.P["APPLY"](this.nextToken(), expr);
					else if( nextToken.type == "LP"){
						expr = {type: "apply", operator: expr, args: []};
						do{
							nextToken = this.nextToken();
							if(nextToken.type == "RP") break;
							let arg = this.P["EXPRESSION"](nextToken);
							expr.args.push(arg.expr);
							nextToken = arg.rest;
							if(nextToken.type != "COMMA" && nextToken.type != "RP") 
								throw new EggParserSyntaxException(`Unexpected syntax on APPLY : ${nextToken.match[0]} ...`  ,{expr:expr,rest:nextToken.match[0]}); //No hay ni más argumentos ni, por consecuencia, se cierra la función, aqui hay un error.							
						}while( nextToken.type != "RP" );
						return this.P["APPLY"](this.nextToken(),expr);
					}
					else return {expr: expr, rest: nextToken}; //Si no empieza por '(' entonces es cadena vacia o es una llamada recursiva de iteració sobre parametros.
				}
            };
            return new Grammmar(V,S,P,E);
        })()
	}
		
	/**
	 * Metodo encargado de transformar el codigo escrito en EGG en su equivalente en arbol de analisís sintactico
	 * @param {String} program Cadena que contiene el codigo fuente. 
	*/
	parse(program){
		let {expr,rest} =this.G.start(program);
		if(rest.type != "END")
			throw new EggParserSyntaxException(`Unexpected text after program: ${rest.match[0]}`,{expr:expr,rest:rest.match[0]});
		return expr;	
	};

	/**
	 * 
	 * @param {String} path Ruta local a fichero que se quiere leer
	 * @param {Function(Error error, AST data)} onComplete Función a invocar cuando se termine de leer el fichero para pasarle el contenido leido
	 */
	parseFile(path,onComplete){
		const fs = require("fs");
		fs.readFile(path,"utf8",(error,data) =>{
			if(error) onComplete(error);
			else onComplete(undefined, this.parse(data));
		});
	}

	/**
	 * 
	 * @param {String} path Ruta local a fichero sobre el que soltar contenido.
	 * @param {Object} AST Árbol sintactico de analisís que quiere ser escrito en fichero apuntado por path
	 */
	outputToFile(path, AST, onComplete = (error,outputPath) => {
		if(error) throw error;
		else console.log(`Se ha escrito correctamente el AST en ${outputPath}`)
	}){
		const fs = require('fs');
		AST = JSON.stringify(AST);
		fs.writeFile(path,AST,"utf8",(error) =>{
			if(error) onComplete(error);
			else onComplete(undefined, path);
		});
	}

	/**
	 * 
	 * @param {String} inputPath Ruta a fichero que contiene el codigo fuente del programa egg 
	 * NOTA: El output será inputPath+".evm"
	 */
	intputAndOutputFromFile(inputPath, onComplete){
		const outputPath = inputPath+".evm";
		this.parseFile(inputPath, (error,AST)=>{
			if(error) throw error;
			else{
				if(!onComplete) this.outputToFile(outputPath,AST);
				else this.outputToFile(outputPath,AST, onComplete);
			} 
		})
	}

	/**
	 * Analiza el programa y calcula -> nº'(' - nº')' . 
	 * @param {String} program Programa
	 */
	balance(program){
		let countOpenBrackets =  ((program||'').match(/[(]/g)||[]).length;
		let countCloseBrackets = ((program||'').match(/[)]/g)||[]).length;
		return countOpenBrackets - countCloseBrackets
	}

}
module.exports = {
	EggParserSyntaxException,
	Grammmar,
	EggParser
}



//str = "a# hello\nx\n#other comment\n      b = 5"
//regex = /(\s|#.*)*/g

//eggParser = new EggParser();

/*
console.log(eggParser.parse(`  do {
    def(sum,  ; function
      -> { nums, 
        do {
           := (i, 0), # Creates a local variable i and sets to 0
           := (s, 0), # Creates local var s and sets to 0
           while { <(i, length(nums)),
             do { =(s, +(s, <-(nums, i))),
                =(i, +(i, 1))
             }
           },
           s
        }
     )
   },
   print(+("sum(array[1, 2, 3]) := ", sum(array[1, 2, 3])))
  }`));
*/
/*
try{
	console.log(eggParser.parse("+(a, 10'lol'"));
} catch(ex){
	console.log("Error capturado ");
	console.log(ex.data);
	//console.log(ex.data);
}*/
//console.log(eggParser.parse("+(a, 10)"));
// → {type: "apply",
//    operator: {type: "word", name: "+"},
//    args: [{type: "word", name: "a"},
//           {type: "value", value: 10}]}

//console.log(eggParser.parse("# hello\nx"));
// → {type: "word", name: "x"}


//console.log(eggParser.parse("a # one\n   # two\n()"));
// → {type: "apply",
//    operator: {type: "word", name: "a"},
//    args: []}

//console.log(eggParser.parse("#comentario\n+(#arg1\na,#arg2\n 10)"));

//console.log(eggParser.parse( "define(a,'10')puesotrascosas"));