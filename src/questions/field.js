export const fieldQs = [
    {
      type: 'input',
      name: 'fieldName',
      message: 'Enter field name:',
      validate: function (value) {
        var valid = value.length>=3;
        return valid || 'Min 3 symbols';
      },
      filter: String,
    },
    {
      type: 'confirm',
      name: 'nullable',
      message: 'Can this field be null in the database (nullable)',
      default: true,
    },
    {
      type: 'rawlist',
      name: 'fieldType',
      message: 'Select type of field',
      choices: ['boolean', 'string', 'integer', 'text','timestamp','datetimetz','datetime','smallint','float','decimal','bigint','OneToOne', 'OneToMany', 'ManyToOne','ManyToMany'],
    },
   

  ];

  export const entityQs =  {
    type: 'input',
    name: 'name',
    message: 'Enter entity name:',
    validate: function (value) {
      var valid = value.length>=1;
      return valid || 'Min 1 symbol';
    },
    filter: String,
}


export const needFieldQs = {
    type: 'confirm',
    name: 'needField',
    message: 'Create new field?',
    default: false,
  }