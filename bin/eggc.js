if(!process.argv[2])
    console.error("Debe pasarse como parametro la ruta a un fichero codigo fuente EGG");
else{
    const {EggParser} = require("../lib/eggParser");

    const eggParser = new EggParser();
    
    eggParser.intputAndOutputFromFile(process.argv[2]);
}
