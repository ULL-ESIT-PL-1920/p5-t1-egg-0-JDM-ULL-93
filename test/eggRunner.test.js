let fs = require('fs');
let {EggVM} = require("../lib/eggRunner");

const target = new EggVM();

test("Uso simple. Ejecuta programa EGG y devuelve resultado esperado",()=>{
    const program = `
    do(define(sum, fun(array,
         do(define(i, 0),
            define(sum, 0),
            while(<(i, length(array)),
              do(define(sum, +(sum, element(array, i))),
                 define(i, +(i, 1)))),
            sum))),
       print(sum(array(1, 2, 3))))
    `;
    target.load(program);
    const expected = 6;
    expect(target.run()).toBe(expected);
});

test("Uso simple con error semantico. Devuelve error", () =>{
    const program = `do("hola"(1,2))`;
    target.load(program);
    expect(() =>{target.run()}).toThrow(TypeError);
});

test("Uso simple con error semantico por nº argumentos incorrectos. Devuelve error", () =>{
    const program = `do(define(a,0),+(a,),print(a))`;
    target.load(program);
    expect(() =>{target.run()}).toThrow(SyntaxError);
});



test("Carga desde fichero. Carga el codigo fuente del programa EGG desde fichero y lo ejecuta correctamente",
() => {
    const programPath = "examples/pow.egg";
    let program;

    fs.readFile("test/examples/pow.egg.expected","utf8",(err,data) => {
        if(err) expect(true).toBe(false);
        else{
            const expected = JSON.parse(data).result;
            target.loadFromFile(programPath, (err,vm) => {
                if(err) expect(true).toBe(false);
                else {
                    const result = vm.run();
                    expect(result).toBe(expected);
                }
            })
        }
    });

});

test("Carga desde fichero. Carga el arbol de un codigo fuente EGG y lo ejecuta con exito", () => {
    const programPath = "examples/pow.egg.evm";
    let program;

    fs.readFile("test/examples/pow.egg.expected","utf8",(err,data) => {
        if(err) expect(true).toBe(false);
        else{
            const expected = JSON.parse(data).result;
            target.loadFromFile(programPath, (err,vm) => {
                if(err) expect(true).toBe(false);
                else {
                    const result = vm.run();
                    expect(result).toBe(expected);
                }
            })
        }
    });

});