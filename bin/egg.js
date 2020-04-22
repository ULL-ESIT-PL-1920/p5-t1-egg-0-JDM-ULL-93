if(process.argv[2]){
    const {EggVM} = require("../lib/eggRunner");

    const eggRunner = new EggVM();
    
    eggRunner.loadFromFile(process.argv[2],(error,runner) => {
        if(error) console.error(error);
        else runner.run();
    });
}
else{
    console.log("hola")
    const inspect = require("util").inspect; // Para volcar por consola el contenido de los objetos JS
    let ins = (x) => inspect(x, {depth:null});
    
    let readline = require('readline'); // Una interfaz de consola.
    const colors = {
        RED : '\033[31m',
        BLUE : '\033[34m',
        DEFAULT : '\033[39m'
    };
    const PROMPT = colors.DEFAULT + "> ";
    
    const eggRunner = require('./../lib/eggRunner');
    let vm = new eggRunner.EggVM(); //parse
    let parser = vm.parser; //parser
    let coreStatements = vm.coreStatements; //specialForms
    let coreScope = new eggRunner.EggCoreScope(); //topEnv

    const WHITES = /((\s)|(#.*))+/;
    const getTokens = parser.parse;
    const parBalance = parser.balance;

    let program = "";
    let stack = 0; //Diferencia -> nº'(' - nº')'
    try{
        let rl = readline.createInterface({input: process.stdin, output:process.stdout,completer});
        rl.prompt(PROMPT); console.log("Version 0.1");
        rl.prompt();

        rl.on('line',function(line){
            stack += parBalance(line);
            line = line + '\n';
            program += line;
            
            if(stack == 0 && program.replace(WHITES,"").length != 0){
                try{
                    let r = vm.load(program).run();
                    console.log(ins(r));
                }catch(ex){
                    console.log(colors.RED+ex.message)
                }
                program = "";
                stack = 0;
            }
            rl.setPrompt(PROMPT +  "..".repeat(stack));
            rl.prompt();
        });

        rl.on('SIGINT',() =>{
            if(program != ""){
                console.log(colors.RED+"Expresión descartada");
                program = "";
                stack = 0;
                rl.setPrompt(PROMPT);
                rl.prompt();
            }
            else
                rl.close();
           
        });

        rl.on("close",() =>{
            console.log(colors.BLUE+"Adios!!"+colors.DEFAULT);
            process.exit(0);
        });
    } catch(e){
        console.log(colors.RED+e.message);
    }
}

function completer(line){
    let tokens;
    try{
        tokens = getTokens(line);
    }catch(ex){
        tokens = ex.expr;
    }
    var word = tokens.filter((t) => t && t.type === "WORD").pop().value;

    let allKeys = Object.keys(coreStatements).concat(Object.keys(coreScope));
    var hits = allKeys.filter((key) => key.startsWith(word));
    return [hits,word];
}

function eggRepl(){
    
}