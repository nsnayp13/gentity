// const inquirer = require('inquirer');
// const path = require('path');
// const fs = require('fs');
// const ts = require('typescript');
import inquirer from 'inquirer';
import fs from 'fs';

import { readdir } from 'fs/promises';
import path, { resolve } from 'path';
import { fieldQs, entityQs, needFieldQs } from './questions/field.js';
import ts from 'typescript';
import pkg from 'ts-morph';
const { Project, NewLineKind, IndentationText } = pkg;

// const Project = require('ts-morph').Project;


export class AstMorph {

  program;
  source;
  nodeClass;
  isNew = true

  constructor(className, filePath){
    this.className = className;
    this.filePath = filePath;
    this.project = new Project({
      manipulationSettings:{
        newLineKind: NewLineKind.CarriageReturnLineFeed,
        indentationText: IndentationText.FourSpaces,
        
      }
    });
   

    if(!filePath){
      this.source = this.project.createSourceFile("./"+className.toLowerCase()+".entity.ts");
      this.isNew = true;
    }else{
      this.source = this.project.addSourceFileAtPath(filePath);
      this.isNew = false;
    }

    
    //const classes = sourceFile.getClasses();


  }

  comImport(name, path = 'typeorm'){
    if(!this.source.getImportDeclaration(path)&&path!=='typeorm'){
      this.source.addImportDeclaration(
        {
          defaultImport:name,
          moduleSpecifier: path
        });
    }else if(!this.source.getImportDeclaration(path)&&path==='typeorm'){
      this.source.addImportDeclaration(
        {
          namedImports:[name],
          moduleSpecifier: path
        });
    }else{

      if(this.source.getImportDeclaration(path).getNamedImports().filter(node => node.getName() === name  ).length === 0  ) {
        this.source.getImportDeclaration(path).addNamedImport(name)
      }

    }

  }

  createOrModifyClass(){

    let nodeClass;
    if(this.isNew){

      this.comImport('Entity');

      nodeClass = this.source.addClass({
        decorators:[{name:"Entity", arguments:[]}],
        name:this.className
      })
    }else{
      nodeClass = this.source.getClass(this.className)
    }
    
    if(!nodeClass) {
      throw new Error(`No class ${this.className}`)
    }

    this.nodeClass = nodeClass;

  }



  getDecoratorByField(field){

    switch (field.fieldType) {
      case 'OneToOne':
        this.comImport('OneToOne');
        this.comImport('JoinColumn');

        return [
          {
            name:"OneToOne",
            arguments:  [ "() => "+field.entity ]
          },
          {
            name:"JoinColumn",
            arguments:[]
          }
        ]
      case 'ManyToOne':
        this.comImport('ManyToOne');

          return [{
            name:"ManyToOne",
            arguments:["type => "+field.entity, field.entity.toLowerCase()+" => "+field.entity.toLowerCase()+"."+field.fieldNameRelation]
          }]
      case 'OneToMany':
        this.comImport('OneToMany');
        return [{
          name:"OneToMany",
          arguments:  [ "() => "+field.entity, field.entity.toLowerCase()+" => "+field.entity.toLowerCase()+"."+this.className.toLowerCase()]
        }]
       case 'ManyToMany':
        this.comImport('ManyToMany');
        this.comImport('JoinTable');
        return [
          {
            name:"ManyToMany",
            arguments:  [ "() => "+field.entity ]
          },
          {
            name:"JoinTable",
            arguments:[]
          }
        ]
      default:
        this.comImport('Column');
        return[{
          name:'Column',
          arguments:[]
        }]
        break;
    }

  }

  getTypeByField(field){
    if(["OneToOne","ManyToOne"].includes(field.fieldType)){
      return field.entity
    }else if(["OneToMany","ManyToMany"].includes(field.fieldType)){
      return field.entity+'[]';
    }else{
      return field.fieldType
    }
  }


  addProperty(field){

    if(field.entity){
      this.comImport(field.entity, field.entityPath);
    }
    this.nodeClass.addProperty({
      decorators:this.getDecoratorByField(field),
      name:  field.fieldName,
      type: this.getTypeByField(field),
      leadingTrivia: writer => writer.newLine(),
    })
  }



  save(){
    this.project.save();
  }




}





export class Ast {
  isNew = false;
  filepath = '';
  program;
  source;
  className;
  answers;
  relationTypes = ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'];

  nodeImports = [];
  nodeClass;

  constructor(filepath, isNew = false, className) {
    this.className = className;
    this.isNew = isNew;
    this.filepath = filepath;
    this.program = ts.createProgram([filepath], {});

    if (!isNew) {
      this.source = this.program.getSourceFile(filepath);
    }
  }

  createClass() {
    const factory = ts.factory;
    return ts.factory.createClassDeclaration(
      [
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier('Entity'),
            undefined,
            []
          )
        ),
      ],
      undefined,
      factory.createIdentifier(this.className),
      undefined,
      undefined,
      /** HERE PROPS 5 index*/
      []
    );
  }

  createDecoratorRelation(prop) {
    const factory = ts.factory;
    return [
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createIdentifier(prop.entity)
      ),
      factory.createArrowFunction(
        undefined,
        undefined,
        [
          factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            factory.createIdentifier(prop.entity.toLowerCase()),
            undefined,
            undefined,
            undefined
          ),
        ],
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createPropertyAccessExpression(
          factory.createIdentifier(prop.entity.toLowerCase()),
          factory.createIdentifier(prop.fieldNameRelation)
        )
      ),
    ];
  }

  createProp(prop) {
    const factory = ts.factory;

    return factory.createPropertyDeclaration(
      [
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier(
              this.relationTypes.includes(prop.fieldType)
                ? prop.fieldType
                : 'Column'
            ),
            undefined,
            /** Array for Decorator data */
            this.relationTypes.includes(prop.fieldType)
              ? this.createDecoratorRelation(prop)
              : []
          )
        ),
      ],
      undefined,
      factory.createIdentifier(prop.fieldName),
      undefined,
      factory.createTypeReferenceNode(
        factory.createIdentifier(
          this.relationTypes.includes(prop.fieldType)
            ? prop.entity
            : prop.fieldType
        ),
        undefined
      ),
      undefined
    );
  }

  createProps() {
    return this.answers.fields.map((prop) => this.createProp(prop));
  }

  createImports(entities) {
    const factory = ts.factory;

    if (entities) {
      return entities.map((entity) => {
        return factory.createImportDeclaration(
          undefined,
          undefined,
          factory.createImportClause(
            false,
            factory.createIdentifier(entity.className),
            undefined
          ),
          factory.createStringLiteral(entity.filepath)
        );
      });
    }
    return [];
  }

  addProperty(field) {}

  getNewNodes() {
    let nodeClass;
    const nodes = [];
    ts.forEachChild(this.source, (node) => {
      if (node.kind === ts.SyntaxKind.ClassDeclaration) {
        this.nodeClass = node;

        const props = [];

        this.answers.fileds.map((field) => {
          if (field.entity === this.className) {
            props.push(this.createProp(field));
          }
        });
      } else if (node.kind === ts.SyntaxKind.ImportDeclaration) {
        this.nodeImports.push(node);
      }

      this.nodes.push(node);
    });
    return nodes;
  }

  tester(answers = null) {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath('./product.entity.ts');
    const classes = sourceFile.getClasses();
    const nodeClass = classes[0];


    const property = nodeClass.addProperty({
      decorators:[
        {
            name: "MyDecorator",
            arguments: ["3", `"some string"`],
        }
      ],
      isStatic: true,
      name: "prop",
      type: "string",
    });
    
    project.save();

    // this.answers = asnwers;
    // let nodeClass = this.rewriteClass();
    // nodeClass = ts.factory.updateClassDeclaration(nodeClass,null,null,"FUCK",null,null,[])

    // this.createNewFile([nodeClass]);
  }

  addRelation() {
    this.source.update();
  }

  createBody(answers, allEntities) {
    //console.log(answers)
    this.answers = answers;
    let entities = [];

    if (allEntities) {
      entities = allEntities.filter((ent) => {
        return this.answers.fields.find(
          (answer) => ent.className === answer.entity
        );
      });

      entities.map((entity) => {
        let ast = new Ast(entity.filepath, false, entity.className);
        ast.addRelation(this.answers);
      });

      this.changeRelativeEntity();
    }

    const nodeImports = this.createImports(entities);
    let nodeClass = this.createClass();

    nodeClass = ts.factory.updateClassDeclaration(
      nodeClass,
      null,
      null,
      null,
      null,
      null,
      this.createProps()
    );

    //nodeClass. .push(this.createProps());

    return [...nodeImports, ...[nodeClass]];
  }

  createNewFile(nodes) {
    //const nodeClass = this.createClass();

    const data = ts.factory.createNodeArray(nodes, true);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const strings = printer.printList(ts.ListFormat.AllowTrailingComma, data);
    fs.writeFileSync(
      path.resolve('.', this.className.toLowerCase() + '.entity.ts'),
      strings,
      { flag: 'w' }
    );
    console.log('written');
  }

  getDecorator(node) {
    for (const child of node.getChildren()) {
      if (child.kind === ts.SyntaxKind.Decorator) {
        return child;
      }
    }
    return null;
  }

  getEntity(file) {
    const program = ts.createProgram([file], {});
    const source = program.getSourceFile(file);
    const className = ts.forEachChild(source, (node) => {
      if (node.kind === ts.SyntaxKind.ClassDeclaration) {
        if (node.decorators) {
          const decorators = node.decorators.map(
            (decorator) => decorator.expression.expression.escapedText
          );
          if (decorators.includes('Entity')) {
            return node.name.escapedText;
          }
        }
      }
    });
    return className;
  }
}

class FsReader {
  exclude = ['node_modules'];

  findEntities(dir) {
    const entities = [];
    const files = this.getFiles(dir);
    files.map((file) => {
      const className = this.isEntity(file);
      if (className) {
        entities.push({
          filepath: file,
          className,
        });
      }
    });

    return entities;
  }

  isEntity(file) {
    const ast = new Ast(file, false, 'test');
    return ast.getEntity(file);
  }

  getFiles(dir) {
    if (dir.indexOf('node_modules') < 0) {
      var results = [];
      var list = fs.readdirSync(dir);
      list.forEach(
        function (file) {
          file = dir + '/' + file;
          var stat = fs.statSync(file);
          if (stat && stat.isDirectory()) {
            this.getFiles(file)
              ? (results = results.concat(this.getFiles(file)))
              : null;
          } else {
            if (file.match(new RegExp(`.*\.(ts)$`, 'ig'))) {
              results.push(file);
            }
          }
        }.bind(this)
      );
      return results;
    }
    return null;
  }
}

export class Cli {
  answers = {
    name: '',
    fields: [],
  };

  entities;

  relationTypes = ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'];

  constructor() {
    this.fsReader = new FsReader();
  }

  start = () => {
    console.log('Hi, lets start generate TypeOrm entity easy');
    this.askForEntity();
  };

  askForEntity = () => {
    inquirer.prompt(entityQs).then((answers) => {
      this.answers = { ...this.answers, ...answers };
      inquirer.prompt(needFieldQs).then((answer) => {
        this.askForFields(answer.needField);
      });
    });
  };

  getEntities() {
    if (!this.entities) {
      this.entities = this.fsReader.findEntities('.');
    }
    return this.entities;
  }

  async askForEntityFile(qs) {
    return await inquirer.prompt(qs);
  }

  mapEntitiesToQuestion(entities) {
    const question = {
      type: 'rawlist',
      name: 'entity',
      message: 'Select type of field',
      choices: [],
    };
    entities.map((entity) => question.choices.push(entity.className));
    return question;
  }

  async askForTypeRelation(indexQuestion) {
    const answer = this.answers.fields[indexQuestion];
    let answers = {};

    switch (answer.fieldType) {
      case 'ManyToOne':
        answers = await inquirer.prompt({
          type: 'input',
          name: 'fieldNameRelation',
          message: 'Enter field name mapped in ' + answer.entity + ':',
          validate: function (value) {
            var valid = value.length >= 1;
            return valid || 'Min 1 symbols';
          },
          filter: String,
        });
        break;

      default:
        break;
    }

    this.answers.fields[indexQuestion] = { ...answer, ...answers };
  }

  async askForFields(needField = false) {
    if (needField) {
      const answers = await inquirer.prompt(fieldQs);
      this.answers.fields.push(answers);

      if (this.relationTypes.includes(answers.fieldType)) {
        const qs = this.mapEntitiesToQuestion(this.getEntities());
        const a = await inquirer.prompt(qs);
        this.answers.fields[this.answers.fields.length - 1].entity = a.entity;

        await this.askForTypeRelation(this.answers.fields.length - 1);

        const needFieldAnswer = await inquirer.prompt(needFieldQs);
        this.askForFields(needFieldAnswer.needField);
      } else {
        const needFieldAnswer = await inquirer.prompt(needFieldQs);
        this.askForFields(needFieldAnswer.needField);
      }
    } else {
      /** There we get all answers */
      

      const ast = new AstMorph(this.answers.name);
      ast.createOrModifyClass();
      this.answers.fields.map( (field,i)=> { 
        
        if(field.entity){
          field.entityPath = this.entities.find(item=>item.className === field.entity).filepath.replace(/\.[^.ts]$/, "")

        }
        
        ast.addProperty(field)
        this.answers.fields[i] = field;


      })
      ast.save();
      console.log(this.answers);

      // const ast = new Ast('', true, this.answers.name);
      // const nodes = ast.createBody(this.answers, this.entities);
      // ast.createNewFile(nodes);




    }
    return;
  }
}
