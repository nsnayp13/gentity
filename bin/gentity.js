#!/usr/bin/env node
import { Cli, AstMorph } from '../src/index.js';

 const ast = new AstMorph('Tester');
 ast.createOrModifyClass();
ast.comImport('Column');
ast.comImport('Column')
ast.comImport('Entity')
    ast.save()


// const cli = new Cli()
// cli.start();
