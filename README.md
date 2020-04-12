
# Analizando sintaxis lenguaje EGG
Una sintaxis correcta para este lenguaje es la siguiente:
```egg
do(define(x, 10),
   if(>(x, 5),
      print("large"),
      print("small")))
```

Es decir, en este lenguaje los bloques de codigo tipicos de la programación estructurada en donde se define un ambito local determinado para una secuencia de instrucciones se sustituyen por:
1) La llamada al metodo *'do'* si es un bloque simple
2) La llamada al metodo *'if'* si es un bloque que modifica la linea de ejecución de forma condicional
3) La llamada al metodo *'while'* si es un bloque se repite iterativamente de forma condicional
Todos los anteriores casos, a excepción del primero, recogen como primer argumento uno de las siguientes llamadas a los metodos de comparación:
1) >(<arg1>,<arg2>)
2) <(<arg1>,<arg2>)
3) <=(<arg1>,<arg2>)
4) >=(<arg1>,<arg2>)
5) ==(<arg1>,<arg2>)
6) !=(<arg1>,<arg2>)

Y a todos les sigue como argumento un metodo que representaría la secuencia de instrucciones que se van a ejecutar dentro de un ambito/*scope* local definido por los metodos *'do','if','while'*. Lo que sigue sigue dentro de cada uno de ellos es un formato repetido tal que así:

```html
<nombreMetodo>(<arg1>,<arg2>,...,<argN>),<nombreMetodo2>(<arg1>,<arg2>,...,<argN>), ...
```

Los argumentos que recibe solo pueden ser string ("algo" por ej), nombres de otras variables(x por ej), y un número(5 por ej).

Por lo tanto, si juntamos todas las piezas, si existe una gramatica tal que:
```
G = ( Σ, V, P, S ) donde
   Σ = Alfabeto
   V = Conjunto variables no terminales
   P = Reglas de producción
   S = Simbolo de Arranque
```

Que represente nuestros lenguaje EGG sería tal que:

```
V = { VALUE, INIT, EXPRESSION, COMP}

S = INIT

P = {

   VALUE: STRING | NUMBER | WORD | WORD'(' EXPRESION ')'

   INIT: do'(' EXPRESION ')'

   EXPRESION: ϵ | VALUE ,? EXPRESION | (if|while) '(' COMP , EXPRESION ')' ,? EXPRESION 

   COMP: >|<|<=|>=|==|!='('VALUE , VALUE ')'

}

Σ = {
   STRING = /"((?:[^"\\]|\\.)*)"/;
   NUMBER = /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/;
   WORD   = /([^\s(),"]+)/;
}
```

A modo de prueba, la probamos contra la siguiente secuencia valida:

```egg
do(define(x, 10),
   if(>(x, 5),
      print("large"),
      print("small")))
```

Nos sale:

```
do( EXPRESION ) ->

do( VALUE, EXPRESION ) ->

do( WORD ( EXPRESION ), EXPRESION ) ->

do( WORD ( VALUE , EXPRESION ), EXPRESION ) ->

do( WORD ( WORD , VALUE ), EXPRESION ) ->

do( WORD ( WORD , NUMBER ), EXPRESION ) ->

do( define ( x , 10 ), if( COMP , EXPRESION ),? EXPRESION ) ->

do( define ( x , 10 ), if( >(VALUE , VALUE ) , EXPRESION ),? EXPRESION ) ->

do( define ( x , 10 ), if( >(WORD , NUMBER ) , EXPRESION ) ) ->

do( define ( x , 10 ), if( >(WORD , NUMBER ) , EXPRESION ) ) ->

do( define ( x , 10 ), if( >(WORD , NUMBER ) , VALUE ,? EXPRESION ) ) ->

do( define ( x , 10 ), if( >(x , 5 ) , WORD( EXPRESION ) ,? WORD( EXPRESION ) ) ) ->

do( define ( x , 10 ), if( >(x , 5 ) , WORD( VALUE ,? EXPRESION ) ,? WORD( VALUE ,? EXPRESION ) ) ) ->

do( define ( x , 10 ), if( >(x , 5 ) , WORD( STRING ,? EXPRESION ) ,? WORD( STRING ,? EXPRESION ) ) ) ->

do( define ( x , 10 ), if( >(x , 5 ) , WORD( STRING ) , WORD( STRING ) ) ) ->

do( define ( x , 10 ), if( >(x , 5 ) , print( "largue" ) , print( "small" ) ) ) 
```

Efectivamente, nuestra gramatica es capaz de representar el lenguaje EGG. Sin embargo, para esta practicas, vamos a utilizar una gramatica más sencilla para reconocer el lenguaje EGG:

```
V  {expression, apply}

S = expression

P = {
   expression: STRING
            | NUMBER
            | WORD apply 

   apply: /* vacio */
      | '(' (expression ',')* expression? ')' apply
}

Σ = {
   WHITES = /(\s|[#;].*|\/\*(.|\n)*?\*\/)*/;
   STRING = /"((?:[^"\\]|\\.)*)"/;
   NUMBER = /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/;
   WORD   = /([^\s(),"]+)/;
}
```