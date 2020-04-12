


class CoreScope {
	constructor(){
		this.true = true;
		this.false = false;
		
		this.length = (array) => array.length;
		this.element = (array, index) => array[index];
		this.array = (...args) => {
			let result = new Array();
			for(let i = 0; i < args.length; i++)
				result.push(args[i]);
			return result;
		};
		
		this.print = (value) => {
			console.log(value);
			return value;
		}
		
		
		
		for (let op of ["+", "-", "*", "/", "==", "<", ">", "!=","<=", ">="])
			this[op] = Function("a, b", `return a ${op} b;`);
	}
}


class EggCoreStatements{
	
	constructor(VM){
		this.VM = VM;
		this.if = (args,scope) => {
			if (args.length != 3) throw new SyntaxError("Wrong number of args to if.");
			if (this.VM.evaluate(args[0], scope) === true) return this.VM.evaluate(args[1], scope);
			else return this.VM.evaluate(args[2], scope);
		};
		
		this.while = (args,scope) => {
			if (args.length != 2) throw new SyntaxError("Wrong number of args to while.");
			while( this.VM.evaluate(args[0],scope) === true)
					this.VM.evaluate(args[1],scope);
		};
		
		this.do = (args, scope) => { 
			let value = false;
			for (let arg of args) {
			  value = this.VM.evaluate(arg, scope);
			}
			return value;
		};
		
		this.define = (args, scope) => {
			if(args.length != 2) throw new SyntaxError("Wrong number of args to define.");
			let value = this.VM.evaluate(args[1], scope);
			scope[args[0].name] = value;
		};
		
		this.fun = (args, scope) => {
			if (!args.length) throw new SyntaxError("Functions need a body");
			let body = args[args.length - 1];
			let params = args.slice(0, args.length - 1).map(expr => {
			  if (expr.type != "word") throw new SyntaxError("Parameter names must be words");
			  return expr.name;
			});
		  
			return (...args) => {
			  if (args.length != params.length) throw new TypeError("Wrong number of arguments");
			  let localScope =  Object.create(scope); //Importante crear un objeto con herencia del primero, para crear un scope con acceso a los scope "padres"
			  for (let i = 0; i < args.length; i++) localScope[params[i]] = args[i];
			  return this.VM.evaluate(body, localScope);
			};
		};
		
		this.set = (args, scope) => {
			if(args.length !=  2) 
				throw new SyntaxError("Incorrect use of Set. Set needs two arguments ");
			else if( args[0].type != "word" ) 
				throw new SyntaxError("Incorrect use of Set. Set needs a word as first argument ");
			let value = this.VM.evaluate(args[1], scope);

			if(args[0].name in scope){
				let scopeIt = scope;
				do{
					scopeIt[args[0].name] = value;
					//No llegamos al scope global, pero hemos llegado al punto donde la variable se definió, más atrás no nos importa tocar (y sería incorrecto):
					if(args[0].name in Object.getOwnPropertyNames(scopeIt)) break; 
				}while(scopeIt = Object.getPrototypeOf(scopeIt));
			}
			else 
				throw new ReferenceError(`Undefined variable: ${args[0].name}`)
		};
	}
	
}



class EggVM{
	
	constructor(){
		const {EggParser} = require("./eggParser");
		this.parser = new EggParser();
		this.coreStatements = new EggCoreStatements(this);
	}
	
	evaluate(expr, scope) {
		if (expr.type == "value") return expr.value;
		else if (expr.type == "word") {
			if (expr.name in scope) return scope[expr.name];
			else throw new ReferenceError(`Undefined binding: ${expr.name}`);
		} 
		else if (expr.type == "apply") {
			let {operator, args} = expr;
			if (operator.type == "word" && operator.name in this.coreStatements) return this.coreStatements[operator.name](expr.args, scope);
			else {
				let op = this.evaluate(operator, scope);
				if (typeof op == "function"){
					let listArgs = args.map(arg => this.evaluate(arg, scope));
					return op(...listArgs);
				}
				else throw new TypeError("Applying a non-function.");
			}
		}
	}
	
	run(){
		this.evaluate(this.AST, new CoreScope())
	}
	
	load(program){
		this.AST = this.parser.parse(program);
		return this;
	}
}	


eggVM = new EggVM();

eggVM.load(`
do(define(total, 0),
   define(count, 1),
   while(<(count, 11),
         do(define(total, +(total, count)),
            define(count, +(count, 1)))),
   print(total))
`).run();
// → 55


eggVM.load(`
do(define(plusOne, fun(a, +(a, 1))),
   print(plusOne(10)))
`).run();
// → 11

eggVM.load(`
do(define(sum, fun(array,
     do(define(i, 0),
        define(sum, 0),
        while(<(i, length(array)),
          do(define(sum, +(sum, element(array, i))),
             define(i, +(i, 1)))),
        sum))),
   print(sum(array(1, 2, 3))))
`).run();
// → 6

eggVM.load(`
do(define(pow, fun(base, exp,
     if(==(exp, 0),
        1,
        *(base, pow(base, -(exp, 1)))))),
   print(pow(2, 10)))
`).run();
// → 1024

eggVM.load(`
do(define(f, fun(a, fun(b, +(a, b)))),
   print(f(4)(5)))
`).run();
// → 9


eggVM.load(`
do(define(x, 4),
   define(setx, fun(val, set(x, val))),
   setx(50),
   print(x))
`).run();
// → 50
