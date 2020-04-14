// Queremos representar un lenguaje que contiene la siguiente gramatica:
// V  {expression, apply}

// S = expression

// P = {
//    expression: STRING | NUMBER | WORD apply 

//    apply: ϵ | '(' (expression ',')* expression? ')' apply
// }

// Σ = {
//    WHITES = /^(\s|#.*)*/;
//    STRING = /"((?:[^"\\]|\\.)*)"/;
//    NUMBER = /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/;
//    WORD   = /([^\s(),"]+)/;
// }
// NOTA: Es muy importante que esta Gramatica sea LL para poder codificarla

class Grammmar{
    /**
     * @param {Map<Number,String>} V Map que contiene los nombres de los no Terminales relacionados con un entero
     * @param {Number} S Id entero que indica cual es el no terminal de inicio 
     * @param {Map<Number,Function} P Reglas de producción de la gramatica.
     * @param {Map<String,RegExp>} E Alfabeto de la gramatica que representa los posibles valores de los no terminales.
     * @param {Regex} [ignoreContent = /\s/] Expresión regular que representa el alfabeto a ir ignorando (de modo que no produzca error)
     */
    constructor(V, S, P, E, ignoreContent = /\s/){
        this.V = V;
        this.S = S;
        this.E = E;
		this.P = P;
    }
	
}

class EggParser{
	/**
	* @param {Regex} [ignoreContent = /\s/] Expresión regular que representa el alfabeto a ir ignorando (de modo que no produzca error)
     */
    constructor(ignoreContent = /(\s|#.*)*/){
		
		this.ignoreContent = ignoreContent
        this.G = (function(){
            
            let V = {
                0 : "EXPRESSION",
                1 : "APPLY"
            }
            let S = 0;
			
			let E = {
                STRING : /^"((?:[^"\\]|\\.)*)"/,
                NUMBER : /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)/, /*/^\d+\b/*/
                WORD   : /^([^(),"]+)/ /*/^([^\s(),#"]+)/ Pero como \s y # lo hemos limpiado antes...*/
            };
			
            let P = {
                EXPRESSION : (program) => { //RECORDAR que esta regla era del estilo: (STRING | NUMBER | WORD) apply (y por eso al final la llamada a la función que trata la otra regla 'apply')
					let match, expr;
					if (match = E["STRING"].exec(program)) 
						expr = {type: "value", value: match[1]};
					else if (match = E["NUMBER"].exec(program)) 
						expr = {type: "value", value: Number(match[0])};
					else if (match = E["WORD"].exec(program)) 
						expr = {type: "word", name: match[0]};
					else  
						throw new SyntaxError("Unexpected syntax: " + program);
					program = program.slice(match[0].length);
					return P["APPLY"]( program, expr);
				},
                APPLY : (program, expr) => {
						if(program[0] != '(') return {expr: expr, rest: program}; //Si no empieza por '(' entonces es cadena vacia o es una llamada recursiva de iteració sobre parametros.
						else program = program.slice(1);
						expr = {type: "apply", operator: expr, args: []}; // "apply" === "function" . No se porque lo llama "apply", "apply" es el nombre de la regla no-terminal
						while (program[0] != ')') { //Bucle debido al cierre estrella que permite a una función tener 0 o N argumentos
							let arg = P["EXPRESSION"](program);
							expr.args.push(arg.expr);
							program = arg.rest; // Importante, sino todos los slices anteriores realizados en la llamada recursiva se pierde.
							if (program[0] == ',') program = program.slice(1); //Hay más argumentos, eliminamos la ','
							else if (program[0] != ')') 
								throw new SyntaxError("Expected ',' or ')'"); //No hay ni más argumentos ni, por consecuencia, se cierra la función, aqui hay un error.
						}
						return P["APPLY"](program.slice(1),expr); //Si analizamos la sintaxis de este lenguaje, toda la cadena ha debido procesar previamente, por lo cual, esta llamada es para comprobar que lo que sigue es cadena vacia
					}
            }
            return new Grammmar(V,S,P,E);
        })()
	}
	
	/**
	 * Metodo para limpiar cadena de caracteres no reconocidos por la gramatica pero que son validos igualmente(por ej: comentarios, espacios en blanco,...)
	 * @param {String} str Cadena que contiene el contenido a limpiar. 
	 * @param {String/Function} [replaceFor = ""] Cadena por la que sustituir los elementos a sustituir o función que maneje la sustitución.
	 * @param {RegExp} [ignoreRegex = this.ignoreContent] Expresión regular que representa alfabeto de caracteres a limpiar de cadena original.  
	 */
	sanitaze(str, replaceFor = "" , ignoreRegex = this.ignoreContent){ //En lugar de ir borrando en medio del proceso, yo elimino todos los espacios, saltos de lineas y comentarios desde el principio
		let regex = new RegExp(ignoreRegex,"g") //g = Global, m = multiline
		return str.replace(regex, replaceFor);
	};
	
	/**
	 * Metodo encargado de transformar el codigo escrito en EGG en su equivalente en arbol de analisís sintactico
	 * @param {String} program Cadena que contiene el codigo fuente. 
	 * @param {Boolean} [clean = true] ¿Debe limpiarse el codigo fuente antes de procesarse?
	 * @param {String/Function} [replaceFor = ""] Cadena por la que sustituir los elementos a sustituir o función que maneje la sustitución. 
	 */
	parse(program, clean = true, replaceFor = ""){
		program = clean ? this.sanitaze(program,replaceFor) : program;
		let initRule = this.G.V[this.G.S];
		let {expr, rest} = this.G.P[initRule](program);
		if(rest.length > 0) throw new SyntaxError("Unexpected text after program");;
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

}
module.exports = {
	Grammmar,
	EggParser
}


//str = "a# hello\nx\n#other comment\n      b = 5"
//regex = /(\s|#.*)*/g

//eggParser = new EggParser();
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
