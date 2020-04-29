// Queremos representar un lenguaje que contiene la siguiente gramatica:
// V  {expression, apply}
//
// S = expression
// 
// P = { //up to v1.0.4
//    expression: (WHITES expression) | ((STRING | NUMBER) | WORD apply) 
//
//    apply: ϵ | (WHITES apply) | ('(' (expression ',')* expression? ')' apply) 
// }
//
//	P = { //up to v1.1.0
//		init : ϵ | WHITES expression | STRING|NUMBER|WORD apply 
//		expression: ϵ | VALUE expression | STATEMENTS LP
//		
//		expression : ((WHITES expression) | (STRING | NUMBER | WORD) apply)
//		apply : ϵ | (WHITES apply) | LP coreApply 
// }
//
//
// Σ = { //up to v1.0.4
// 		WHITES 	= /^(\s|#.*)*/;
//		STRING 	= /^"((?:[^"\\]|\\.)*)"/;
//		NUMBER 	= /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)/;
//		WORD   	= /^([^\s(),"#]+)/;
// }
// Σ = { //up to v1.1.0
// 		WHITES 		= /^(\s|#.*)*/;
//		STRING 		= /^"((?:[^"\\]|\\.)*)"/;
//		NUMBER 		= /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)/;
//		WORD   		= /^([^\s(),"#]+)/;
//		STATEMENT 	= /^(if|while|do)/i
//		LP1	 		= /^([(]|{])/;
//		RP1    		= /^([)]|})/;
//		LP			= /^([(])/;
//		RP			= /^([)])/;
//		COMMA:  	= /^(,)/;
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
    constructor(V, S, P, E){
		const self = this;

        this.V = V;
		this.S = S;
		this.E = E;

		this.tokens = [];
		this.lookedAhead = {};
		this.lastIndex = 0;
		this.lookAhead = (program) => {
			do{
				let match = null;
				for(const NT in self.E){
					self.E[NT].lastIndex = self.lastIndex;
					if(match = self.E[NT].exec(program)){
						self.lastIndex += match[0].length;
						self.tokens.push({"match": match, type: NT });
						break;
					}
				}						
			}while(match.lastIndex != program.length);
		};

		/*this.lookAhead = (program) => {
			let match;
			for(const NT in self.E){
				if(self.E["x"]) debugger;
				if(match = self.E[NT].exec(program)){
					self.lookedAhead = {'type' : NT, 'match' : match};
					return program.slice(match[0].length);
				}
			}
			self.lookedAhead = {'type' : "EMPTY", 'match' : 0};
			return program;
		};*/

		this.P = [];
		for(const ele in P)
			this.P[ele] = function(program, ...args){
				program = self.lookAhead(program);
				return P[ele].call(self,program , ...args);
			};

		
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
				WHITES 	: /^((\s)|((#|;).*))+/y,
                STRING 	: /^"((?:[^"\\]|\\.)*)"/y,
                NUMBER 	: /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)/y, /*/^\d+\b/*/
				WORD   	: /^([^{}(),"#\s]+)/y,
            };
			
            /*let P = {
                EXPRESSION : function(program) { //RECORDAR que esta regla era del estilo: (STRING | NUMBER | WORD) apply (y por eso al final la llamada a la función que trata la otra regla 'apply')
					let match, expr;
					if( match = E["WHITES"].exec(program)){
						program = program.slice(match[0].length);
						return this.P["EXPRESSION"](program);
					}
					else{
						if ( match = E["STRING"].exec(program))//match = E["STRING"].exec(program) ) 
							expr = {type: "value", value: match[1]};
						else if (match = E["NUMBER"].exec(program)) 
							expr = {type: "value", value: Number(match[0])};
						else if (match = E["WORD"].exec(program))
							expr = {type: "word", name: match[0]};
						else  
							throw new EggParserSyntaxException(`Unexpected syntax: ${program.slice(0,10)} ...`,{expr:expr,rest:program});
						return this.P["APPLY"](program.slice(match[0].length), expr); 
					}
					//
				},
                APPLY : function(program, expr){
					let match;
					if(match = E["WHITES"].exec(program)){
						program = program.slice(match[0].length);
						return this.P["APPLY"](program, expr);
					}
					else if(program[0] != '(') return {expr: expr, rest: program}; //Si no empieza por '(' entonces es cadena vacia o es una llamada recursiva de iteració sobre parametros.
					else program = program.slice(1);
					expr = {type: "apply", operator: expr, args: []}; // "apply" === "function" . No se porque lo llama "apply", "apply" es el nombre de la regla no-terminal
					while (program[0] != ')') { //Bucle debido al cierre estrella que permite a una función tener 0 o N argumentos
						let arg = this.P["EXPRESSION"](program);
						expr.args.push(arg.expr);
						program = arg.rest; // Importante, sino todos los slices anteriores realizados en la llamada recursiva se pierde.
						if (program[0] == ',') program = program.slice(1); //Hay más argumentos, eliminamos la ','
						else if (program[0] != ')')
							throw new EggParserSyntaxException(`Unexpected syntax: : ${program.slice(0,10)} ...`  ,{expr:expr,rest:program}); //No hay ni más argumentos ni, por consecuencia, se cierra la función, aqui hay un error.							
					}
					return this.P["APPLY"](program.slice(1),expr); //Si analizamos la sintaxis de este lenguaje, toda la cadena ha debido procesar previamente, por lo cual, esta llamada es para comprobar que lo que sigue es cadena vacia
				}
			};*/
			let P = {
                EXPRESSION : function(program) { //RECORDAR que esta regla era del estilo: (STRING | NUMBER | WORD) apply (y por eso al final la llamada a la función que trata la otra regla 'apply')
					const match = this.lookedAhead.match;
					const type = this.lookedAhead.type;
					let expr;
					if( type == "WHITES")
						return this.P["EXPRESSION"](program);
					else{
						if (type == "STRING")//match = E["STRING"].exec(program) ) 
							expr = {type: "value", value: match[1]};
						else if (type == "NUMBER") 
							expr = {type: "value", value: Number(match[0])};
						else if (type == "WORD")
							expr = {type: "word", name: match[0]};
						else  
							throw new EggParserSyntaxException(`Unexpected syntax: ${program.slice(0,10)} ...`,{expr:expr,rest:program});
						return this.P["APPLY"](program, expr); 
					}
					//
				},
                APPLY : function(program, expr){
					//const match = this.lookedAhead.match;
					if( this.lookedAhead.type == "WHITES" ) return this.P["APPLY"](program, expr);
					else if( /[(]|{/.test(program[0])){
						program = program.slice(1);
						expr = {type: "apply", operator: expr, args: []};
						while( !( /[)]|}/.test(program[0])) ){
							let arg = this.P["EXPRESSION"](program);
							expr.args.push(arg.expr);
							program = arg.rest;
							if(program[0] == ',') program = program.slice(1);
							else if(!( /[)]|}/.test(program[0])))
								throw new EggParserSyntaxException(`Unexpected syntax: : ${program.slice(0,10)} ...`  ,{expr:expr,rest:program}); //No hay ni más argumentos ni, por consecuencia, se cierra la función, aqui hay un error.							
						}
						program = program.slice(1);
						return this.P["APPLY"](program,expr);
					}
					else return {expr: expr, rest: program}; //Si no empieza por '(' entonces es cadena vacia o es una llamada recursiva de iteració sobre parametros.
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
		let initRule = this.G.V[this.G.S];
		let {expr} = this.G.P[initRule](program);
		if(this.G.lookedAhead.type != "EMPTY")
			throw new EggParserSyntaxException(`Unexpected text after program: ${this.G.lookedAhead.match[0]}`,{expr:expr,rest:this.G.lookedAhead.match[0]});
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

eggParser = new EggParser();

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
/*try{
	console.log(eggParser.parse("+(a, 10'lol'"));
} catch(ex){
	console.log("Error capturado ");
	console.log(ex.data);
	//console.log(ex.data);
}*/
console.log(eggParser.parse("+(a, 10)"));
// → {type: "apply",
//    operator: {type: "word", name: "+"},
//    args: [{type: "word", name: "a"},
//           {type: "value", value: 10}]}

console.log(eggParser.parse("# hello\nx"));
// → {type: "word", name: "x"}


console.log(eggParser.parse("a # one\n   # two\n()"));
// → {type: "apply",
//    operator: {type: "word", name: "a"},
//    args: []}

console.log(eggParser.parse("#comentario\n+(#arg1\na,#arg2\n 10)"));