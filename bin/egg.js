if(!process.argv[2])
    console.error("Debe pasarse como parametro la ruta a un fichero codigo fuente EGG");
else{
    const {EggVM} = require("../lib/eggRunner");

    const eggRunner = new EggVM();
    
    eggRunner.loadFromFile(process.argv[2],(error,runner) => {
        if(error) console.error(error);
        else runner.run();
    });
}
