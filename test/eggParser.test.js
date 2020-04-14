let fs = require('fs');
let {EggParser} = require("../lib/eggParser");

const target = new EggParser();

test("Sintaxis simple. Devuelve el AST correcto",()=>{
    const str = "+(a, 10)";
    const AST = target.parse(str);
    const expected = {
        type: "apply",
        operator: {type: "word", name: "+"},
        args: [
            {type: "word", name: "a"},
            {type: "value", value: 10}
        ]
    };
    expect(AST).toStrictEqual(expected);
});


test("Sintaxis incorrecta. String con comillas doble escapadas dentro. Not handled. Devuelve un error",() =>{
    const str = "define(a,'\"hola\"')";
    expect(() =>{target.parse(str)}).toThrow(SyntaxError);
});

test("Sintaxis incorrecta. Función('apply') sin cerrar. Devuelve un error",() =>{
    const str = "define(a,'10'";
    expect(() =>{target.parse(str)}).toThrow(SyntaxError);
});

test("Sintaxis incorrecta. Error al final. Devuelve un error",() =>{
    const str = "define(a,'10')puesotrascosas";
    expect(() =>{target.parse(str)}).toThrow(SyntaxError);
});

test("Sintaxis con comentarios en medio de todo el programa. Devuelve el AST correcto",() =>{
    const str = "#comentario\n+(#arg1\na,#arg2\n 10)";
    const AST = target.parse(str);
    const expected = {
        type: "apply",
        operator: {type: "word", name: "+"},
        args: [
            {type: "word", name: "a"},
            {type: "value", value: 10}
        ]
    };
    expect(AST).toStrictEqual(expected);
});

test("Lee codigo fuente EGG desde fichero y lo compila en un AST correctamente", () => {
    const inputPath = "examples/arrays.egg";
    let expected;
    fs.readFile("test/examples/arrays.egg.expected","utf8",(err,data)=>{
        if(err) throw err;
        else expected = JSON.parse(data).AST;
        target.intputAndOutputFromFile(inputPath,(err, outputPath) => {
            if(err) expect(true).toBe(false);
            else{
               
                fs.readFile(outputPath, "utf8",(err,data) => {
                    if(err) expect(true).toBe(false);
                    else{
                        data = JSON.parse(data);
                        expect(data).toStrictEqual(expected);
                    }
                });
            }
        });
    });
});