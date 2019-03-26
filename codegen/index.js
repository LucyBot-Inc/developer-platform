"use strict";

var EJS = window.ejs;

const RESERVED_NAMES = {
  javascript: ['delete', 'list', 'clone', 'export'],
  php: ['list', 'clone', 'goto'],
}

const TMPL_DIR = __dirname + '/templates';

const replaceActionSuffix = str => {
  return str.replace(/Action$/, '');
}

const capitalize = str => {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

const removeKalturaPrefix = str => str.replace(/^Kaltura/, '');

const camelCaseToUnderscore = str => {
  return str.replace(/([a-z])([A-Z])/g, function(whole, lower, upper) {
    return lower + '_' + upper.toLowerCase();
  })
}

const getDefaultValueForType = (type) => {
  if (type === 'string') return '';
  if (type === 'integer' || type === 'number') return 0;
  if (type === 'float') return 0.0;
  if (type === 'boolean') return true;
  if (type === 'array') return [];
  return null;
}

const isPrimitiveSchema = schema => {
  if (schema.type === 'object' || schema.type === 'array') return false;
  return true;
}

const addActionSuffixIfReserved = (lang, action) => {
  if (RESERVED_NAMES[lang].indexOf(action) !== -1) action += 'Action';
  return action;
}

var language_opts = {
  default: {
    accessor: '.',
    statementPrefix: '',
    statementSuffix: '',
    objPrefix: '',
    objSuffix: '',
    enumPrefix: '',
    enumAccessor: '',
    declarationPrefix: '',
    nullKeyword: 'null',
    constant: JSON.stringify,
    comment: function(str) {return '/* ' + str + ' */'},
    assign: function(lval, rval) {return lval + ' = ' + rval},
    emptyArray: function(type, num) {return '[]'},
    arrayAccessor: function(idx) {return '[' + idx + ']'},
    rewriteAttribute: function(s) {return s},
    rewriteVariable: function(s) {return s},
    rewriteAction: function(s) {return s},
    rewriteService: function(s) {return s},
    rewriteEnum: function(s) {return s},
    rewriteType: function(s) {return s},
  },
  curl: {
    ext: 'sh',
  },
  javascript: {
    ext: 'js',
    declarationPrefix: 'var ',
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    rewriteAction: s => addActionSuffixIfReserved('javascript', s),
    fileCode: () => 'new File("/path/to/file")'
  },
  ajax: {
    ext: 'js',
    declarationPrefix: 'var ',
    statementSuffix: ';',
    objPrefix: '',
    objSuffix: '',
    rewriteType: function(s) {
      if (s.indexOf('Kaltura') === 0) return '{objectType: "' + s + '"}';
    },
    rewriteAction: s => addActionSuffixIfReserved('javascript', s),
    rewriteService: function(s) {
      return 'Kaltura' + capitalize(s) + 'Service';
    },
    rewriteEnumValue: function(type, name, value) {
      return JSON.stringify(value) + " /* " + type + '.' + name + " */";
    },
  },
  node: {
    ext: 'js',
    declarationPrefix: 'let ',
    statementSuffix: ';',
    objPrefix: 'new kaltura.objects.',
    objSuffix: '()',
    enumPrefix: 'kaltura.enums.',
    rewriteAction: s => addActionSuffixIfReserved('javascript', s),
    rewriteEnum: removeKalturaPrefix,
    rewriteType: removeKalturaPrefix,
    fileCode: () => "'/path/to/file'",
  },
  angular: {
    ext: 'ts',
    declarationPrefix: 'let ',
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    rewriteAction: capitalize,
    rewriteService: capitalize,
    rewriteEnumValue: (type, name, value) => {
      return type + '.' + name.toLowerCase().replace(/_[a-z]+/g, s => {
        return s.charAt(1).toUpperCase() + s.substring(2).toLowerCase()
      });
    }
  },
  typescript: {
    ext: 'ts',
    declarationPrefix: 'let ',
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    rewriteAction: capitalize,
    rewriteService: capitalize,
    rewriteEnumValue: (type, name, value) => {
      return type + '.' + name.toLowerCase().replace(/_[a-z]+/g, s => {
        return s.charAt(1).toUpperCase() + s.substring(2).toLowerCase()
      });
    }
  },
  php: {
    ext: 'php',
    accessor: '->',
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    enumAccessor: '::',
    nullKeyword: 'NULL',
    rewriteAction: s => addActionSuffixIfReserved('php', s),
    rewriteVariable: s => '$' + s,
    fileCode: () => '"/path/to/file"',
  },
  php53: {
    ext: 'php',
    accessor: '->',
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    enumAccessor: '::',
    nullKeyword: 'NULL',
    rewriteAction: s => addActionSuffixIfReserved('php', s),
    rewriteVariable: s => '$' + s,
    rewriteEnum: removeKalturaPrefix,
    rewriteType: removeKalturaPrefix,
    fileCode: () => '"/path/to/file"',
  },
  swift: {
    ext: 'swift',
    declarationPrefix: 'var ',
    rewriteService: capitalize,
    objSuffix: '()',
    rewriteEnum: removeKalturaPrefix,
    rewriteType: type => {
      type = removeKalturaPrefix(type);
      if (type === 'integer') type = 'Int';
      type = capitalize(type);
      return type;
    },
  },
  ruby: {
    ext: 'rb',
    enumAccessor: '::',
    objSuffix: '.new()',
    nullKeyword: 'nil',
    comment: str => "",
    rewriteVariable: function(s) {
      return camelCaseToUnderscore(s)
    },
    rewriteAttribute: function(s) {
      return camelCaseToUnderscore(s)
    },
    rewriteAction: function(s) {
      s = replaceActionSuffix(s);
      return camelCaseToUnderscore(s)
    },
    rewriteService: function(s) {
      return camelCaseToUnderscore(s) + '_service';
    },
    fileCode: () => 'File.open("/path/to/file")',
  },
  java: {
    ext: 'java',
    declarationPrefix: "<%- type %> ",
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    assign: function(lval, rval) {
      if (lval.indexOf('.') === -1) return lval + ' = ' + rval;
      while (lval.match(/\.\w+\./)) {
        lval = lval.replace(/\.(\w+)\./, function(full, name) {
          return '.get' + capitalize(name) + '().';
        });
      }
      let assignment = lval
          .replace(/\.(\w+)$/, function(full, name) {
            return '.set' + capitalize(name) + '(' + rval + ')';
          })
          .replace(/\.get\((\d+)\)$/, function(full, idx) {
            return '.set(' + idx + ', ' + rval + ')';
          })
      return assignment;
    },
    emptyArray: function(type, num) {return 'new ArrayList<' + type + '>(' + num + ')'},
    arrayAccessor: function(idx) {return '.get(' + idx + ')'},
    rewriteService: capitalize,
    rewriteAction: function(s) {
      return capitalize(replaceActionSuffix(s));
    },
    rewriteType: function(s, arrayType) {
      s = removeKalturaPrefix(s);
      if (s === 'string') return 'String';
      if (s === 'integer') return 'int';
      if (s === 'file') return 'File';
      if (s === 'array') return 'ArrayList<' + removeKalturaPrefix(arrayType) + '>';
      return s;
    },
    rewriteEnumValue: function(type, name, value) {
      return removeKalturaPrefix(type) + '.' + name + '.getValue()';
    },
    fileCode: () => 'new FileInputStream("/path/to/file")',
  },
  csharp: {
    ext: 'cs',
    declarationPrefix: "<%- type %> ",
    statementSuffix: ';',
    objPrefix: 'new ',
    objSuffix: '()',
    emptyArray: function(type, num) {return 'new List<' + type + '>()'},
    arraySetter: function(idx, setter) {return '.Add(' + setter + ')'},
    rewriteAttribute: function(s) {
      return capitalize(s);
    },
    rewriteService: function(s) {
      return capitalize(s) + 'Service';
    },
    rewriteAction: function(s) {
      return capitalize(replaceActionSuffix(s));
    },
    rewriteType: function(s) {
      if (s.indexOf('Kaltura') === 0) return s.substring('Kaltura'.length);
      if (s === 'integer') return 'int';
      return s;
    },
    fileCode: () => 'new FileStream("/path/to/file", FileMode.Open, FileAccess.Read)'
  },
  python: {
    ext: 'py',
    objSuffix: '()',
    nullKeyword: 'None',
    comment: str => "",
    constant: function(val) {
      let c = JSON.stringify(val);
      if (typeof val === 'boolean') {
        c = c.charAt(0).toUpperCase() + c.substring(1);
      }
      return c;
    },
    rewriteAction: function(s) {
      return replaceActionSuffix(s);
    },
    rewriteService: function(name, id) {
      // e.g. name = captionAsset, id = caption_captionasset, should return caption.captionAsset
      let pieces = id.split('_');
      if (pieces.length === 1) return name;
      let plugin = pieces[0];
      if (plugin.toLowerCase() === name.toLowerCase()) plugin = name;
      return plugin + '.' + name;
    },
    rewriteVariable: s => {
      s = camelCaseToUnderscore(s)
      if (s === 'type') s = 'k_type';
      return s
    },
    fileCode: () => "open('/path/to/file', 'rb')",
  },
}

var CodeTemplate = module.exports = function(opts) {
  this.language = opts.language;
  this.swagger = opts.swagger;
  Object.assign(this, language_opts.default, language_opts[this.language]);
  this.template = opts.template;
  this.setupTemplate = opts.setupTemplate;

  this.indent = function(code, numSpaces) {
    if (!numSpaces) return code;
    var lines = code.split('\n');
    var spaces = Array(Math.abs(numSpaces) + 1).join(' ');
    if (numSpaces > 0) {
      return lines.map(function(l) {return l ? spaces + l : l}).join('\n');
    } else {
      return lines.map(function(l) {
        if (l.indexOf(spaces) === 0) return l.substring(spaces.length);
        else return l;
      }).join('\n');
    }
  }
}

const getDefName = (ref) => {
  return ref.substring('#/definitions/'.length);
}

CodeTemplate.prototype.render = function(input) {
  var self = this;
  if (input.path) {
    this.setOperationInputFields(input);
  }
  input = Object.assign({codegen: this}, input);
  var code = EJS.render(this.template, input);
  if (input.showSetup && this.setupTemplate) {
    input.code = code;
    return EJS.render(this.setupTemplate, input).trim();
  } else {
    return code;
  }
}

CodeTemplate.prototype.setOperationInputFields = function(input) {
  var pathParts = input.path.match(/(\/service\/(\w+)\/action\/(\w+))$/);
  this.currentInput = input;
  input.path = pathParts[1];
  input.operation = this.swagger.paths[input.path][input.method];
  let responseSchema = this.maybeResolveRef(input.operation.responses[200].schema);
  if (responseSchema) {
    let items = this.maybeResolveRef(responseSchema.items)
    input.responseType = this.rewriteType(responseSchema.title || responseSchema.type, items ? items.title || items.type : null);
    if (responseSchema.title && responseSchema.title.match(/ListResponse$/)) {
      let items = responseSchema.properties.objects.items;
      items = this.maybeResolveRef(items);
      input.responseListType = this.rewriteType(items.title || items.type);
    }
  }
  input.actionID = pathParts[3];
  input.action = this.rewriteAction(input.actionID);
  input.serviceID = pathParts[2];
  input.serviceName = input.operation.tags[0];
  input.service = this.rewriteService(input.serviceName, input.serviceID);
  input.answers = input.answers || {};
  input.answers.secret = input.answers.secret || 'YOUR_KALTURA_SECRET';
  input.answers.userId = input.answers.userId || 'YOUR_USER_ID';
  input.noSession = input.operation.security && !input.operation.security.length;
  input.plugins = [];
  let tag = this.swagger.tags.filter(t => t.name === input.serviceName)[0];
  if (tag['x-plugin']) {
    input.plugins.push(tag['x-plugin']);
  }
  input.parameterNames = input.operation['x-kaltura-parameters'].map(n => this.rewriteVariable(n));
  input.parameters = [];
  let opType = input.operation['x-kaltura-format'] || 'post';
  if (opType === 'post') {
    this.gatherAnswersForPost(input);
  } else {
    this.gatherAnswersForGetOrFile(input);
  }
}

CodeTemplate.prototype.gatherAnswersForPost = function(input) {
  let findSubschema = (schema, key) => {
    schema = this.maybeResolveRef(schema);
    if (schema.properties && schema.properties[key]) return schema.properties[key];
    let alternatives = (schema.allOf || []).concat(schema.oneOf || []);
    for (let i = 0; i < alternatives.length; ++i) {
      let alt = findSubschema(alternatives[i], key);
      if (alt) return alt;
    }
  }
  let addSchema = schema => {
    let enm = schema['x-enumType'];
    if (enm && input.enums.indexOf(enm) === -1) {
      input.enums.push(enm);
    }
    if (schema.title && input.objects.indexOf(schema.title) === -1) {
      input.objects.push(schema.title);
    }
  }
  let addAnswer = (key, answer, schema) => {
    schema = this.maybeResolveRef(schema);
    addSchema(schema);
    if (Array.isArray(answer)) {
      answer.forEach((ans, idx) => {
        addAnswer(key + '[' + idx + ']', ans, this.maybeResolveRef(schema.items));
      })
    } else if (answer !== null && typeof answer === 'object') {
      if (answer.objectType) {
        schema = this.swagger.definitions[answer.objectType];
      }
      for (let subkey in answer) {
        addAnswer(key + '[' + subkey + ']', answer[subkey], findSubschema(schema, subkey));
      }
      let objectKey = key + '[objectType]';
      if (!schema['x-abstract']) {
        input.answers[objectKey] = input.answers[objectKey] || schema.title;
      }
      if (input.answers[objectKey]) {
        addSchema(this.swagger.definitions[input.answers[objectKey]]);
      }
    } else {
      input.answers[key] = answer;
    }
  }

  let body = JSON.parse(input.answers.body || '{}');
  delete input.answers.body;
  let bodyParam = input.operation.parameters.filter(p => p.in ==='body' && p.name === 'body')[0];
  input.objects = [];
  input.enums = [];

  input.operation['x-kaltura-parameters'].forEach(name => {
    let schema = bodyParam.schema.properties[name];
    schema = this.maybeResolveRef(schema);
    let param = {name, schema};
    input.parameters.push(param);
    addSchema(schema);
    if (name in body) addAnswer(name, body[name], schema);
    else if (schema.default !== undefined) addAnswer(name, schema.default, schema);
  });
  input.enums = input.enums.map(e => this.rewriteEnum(e));
  input.objects = input.objects.map(e => this.rewriteType(e));
}

CodeTemplate.prototype.gatherAnswersForGetOrFile = function(input) {
  let addedParameters = [];
  input.operation.parameters.forEach(p => {
    if (p.$ref) {
      let ref = p.$ref.match(/#\/parameters\/(.*)$/)[1];
      p = this.swagger.parameters[ref];
    }
    if (p.global || p['x-global']) return;
    let baseName = p.name.indexOf('[') === -1 ? p.name : p.name.substring(0, p.name.indexOf('['));
    if (addedParameters.indexOf(baseName) !== -1) return;
    addedParameters.push(baseName);
    if (baseName === p.name) {
      input.parameters.push({name: p.name, schema: p.schema || p})
    } else {
      let group = input.operation['x-parameterGroups'].filter(g => g.name === baseName)[0];
      let title = group.schema.title || getDefName(group.schema.$ref);
      let schema = this.swagger.definitions[title];
      input.parameters.push({name: group.name, schema});
    }
  })
  input.parameters.forEach(p => {
    if (input.answers[p.name] === undefined) {
      if (p.schema.default !== undefined) input.answers[p.name] = p.schema.default;
      else if (p.schema['x-consoleDefault'] !== undefined) input.answers[p.name] = p.schema['x-consoleDefault'];
    }
  })
  input.objects = [];
  input.enums = [];
  let addSchema = schema => {
    let enm = schema['x-enumType'];
    if (enm && input.enums.indexOf(enm) === -1) {
      input.enums.push(enm);
    }
    if (schema.title && input.objects.indexOf(schema.title) === -1) {
      input.objects.push(schema.title);
    }
  }
  input.parameters.filter(p => p.schema).forEach(p => {
    addSchema(p.schema);
  })
  input.enums = input.enums.map(e => this.rewriteEnum(e));
  input.objects = input.objects.map(e => this.rewriteType(e));
}

CodeTemplate.prototype.assignAllParameters = function(params, answers, indent, skipNewline) {
  indent = indent || 0;
  let assignment = this.indent(params.map(p => this.assignment(p, answers)).join('\n'), indent);
  let ending = skipNewline ? '\n' : '\n\n';
  return assignment ? assignment + ending : '';
}

CodeTemplate.prototype.assignment = function(param, answers, parent) {
  var self = this;
  let schema = this.maybeResolveRef(param.schema);
  let subtype = answers[param.name + '[objectType]'];
  if (subtype && subtype !== schema.title) {
    let newParam = {
      name: param.name,
      schema: this.swagger.definitions[subtype],
    }
    return self.assignment(newParam, answers, parent);
  }
  if (param['x-showCondition']) {
    let cond = param['x-showCondition'];
    if (cond.value.indexOf(answers[cond.name]) === -1) return;
  }

  let assignment = '';
  let arrMatch = param.name.match(/\[(\d+)\]$/)
  if (arrMatch && this.arraySetter) {
    assignment = this.lvalue(param) + this.arraySetter(arrMatch[1], this.rvalue(param, answers)) + this.statementSuffix
  } else {
    assignment = this.assign(this.lvalue(param), this.rvalue(param, answers, parent)) + this.statementSuffix;
  }

  const findSubschema = (subParamName, schema) => {
    schema = this.maybeResolveRef(schema);
    let propName = subParamName.split(/\[/).map(s => s.replace(/\]/g, '')).pop();
    if (propName === 'objectType') {
      return this.swagger.definitions[answers[subParamName]];
    } else if (schema.properties && schema.properties[propName]) {
      let subschema = schema.properties[propName];
      if (isPrimitiveSchema(subschema)) {
        return subschema;
      } else {
        return findSubschema(subParamName, subschema);
      }
    } else if (schema.allOf) {
      return schema.allOf.map(sub => findSubschema(subParamName, sub)).filter(s => s)[0];
    }
    return null;
  }
  if (!isPrimitiveSchema(schema)) {
    let subparamRegexp = '^' + param.name.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    subparamRegexp += '\\[(\\w+)\\]';
    let objectSubparamRegexp = new RegExp(subparamRegexp + '\\[objectType\\]$')
    let arraySubparamRegexp = new RegExp(subparamRegexp + '\\[(\\d+)\\].*');
    subparamRegexp = new RegExp(subparamRegexp + '$');
    let subsetters = Object.keys(answers)
      .filter(n => n !== param.name && n.match(subparamRegexp) && !n.match(/\[objectType\]$/))
      .map(n => ({name: n, schema: findSubschema(n, schema)}))
    let objSubsetters = Object.keys(answers)
      .filter(n => n.match(objectSubparamRegexp))
      .map(n => ({name: n.substring(0, n.length - 12), schema: self.swagger.definitions[answers[n]]}));
    let subsetterStatements = subsetters.concat(objSubsetters)
      .filter(prop => prop.schema)
      .map(function(prop) {
        return self.assignment(prop, answers, param);
      });

    let arraySubsetterNames = Object.keys(answers)
      .map(n => n.match(arraySubparamRegexp))
      .filter(match => match)
      .map(match => match[1]);
    arraySubsetterNames = arraySubsetterNames.filter((n, idx) => arraySubsetterNames.lastIndexOf(n) === idx);
    subsetterStatements = subsetterStatements.concat(arraySubsetterNames.map(arrayName => {
      let subschema = this.getPropertySchema(schema, arrayName);
      if (!subschema) throw new Error("Schema not found for property " + arrayName + " in " + schema.title);
      let itemSchema = this.maybeResolveRef(subschema.items);
      let subparam = {name: param.name + '[' + arrayName + ']', schema: subschema};
      let indices = Object.keys(answers)
        .map(n => n.match(arraySubparamRegexp))
        .filter(match => match)
        .map(match => +match[2])
      indices = indices.filter((i, idx) => indices.lastIndexOf(i) === idx);
      let subItemSchema = this.maybeResolveRef(itemSchema.items);
      let arrType = self.rewriteType(itemSchema.title, subItemSchema ? subItemSchema.title || subItemSchema.type : null);
      let statement = self.assign(self.lvalue(subparam), self.emptyArray(arrType, indices.length)) + self.statementSuffix;
      let itemStatements = indices
        .map(index => {
          return {
            schema: itemSchema,
            name: param.name + '[' + arrayName + ']' + '[' + index + ']'
          }
        })
        .map((prop, idx) => {
          return self.assignment(prop, answers, param)
        })
      return ([statement]).concat(itemStatements).join('\n');
    }))
    assignment = ([assignment]).concat(subsetterStatements).join('\n');
  }
  return assignment;
}

CodeTemplate.prototype.lvalue = function(param) {
  var self = this;
  var isChild = param.name.indexOf('[') !== -1;
  let schema = this.maybeResolveRef(param.schema);
  let enumType = schema['x-enumType'];
  if (schema.oneOf && schema.oneOf[0].enum) {
    enumType = schema.title;
  }

  var lvalue = this.statementPrefix;
  if (isChild) {
    let attrs = param.name.split(/\[/).map(s => s.replace(/\]/g, ''));
    lvalue += attrs.map((a, idx) => {
      if (a.match(/^\d+$/)) {
        if (idx === attrs.length - 1 && self.arraySetter) {
          return '';
        } else {
          return self.arrayAccessor(a);
        }
      } else {
        return idx === 0 ? self.rewriteVariable(a) : self.accessor + self.rewriteAttribute(a);
      }
    }).join('');
  } else {
    let type = enumType || (schema.type === 'object' ? schema.title : schema.type) || 'UnknownType';
    let items = this.maybeResolveRef(schema.items);
    type = this.rewriteType(type, items && (items.title || items.type));
    lvalue += EJS.render(self.declarationPrefix, {type}) + self.rewriteVariable(param.name);
  }
  return lvalue;
}

CodeTemplate.prototype.getPropertySchema = function(schema, prop) {
  schema = this.maybeResolveRef(schema);
  if (schema.properties && schema.properties[prop]) {
    return schema.properties[prop];
  }
  let subs = (schema.allOf || []).concat(schema.anyOf || []);
  for (let sub of subs) {
    let propSchema = this.getPropertySchema(sub, prop);
    if (propSchema) return propSchema;
  }
}

CodeTemplate.prototype.maybeResolveRef = function(schema) {
  if (!schema || !schema.$ref) return schema;
  let name = schema.$ref.substring('#/definitions/'.length);
  return this.swagger.definitions[name];
}

CodeTemplate.prototype.rvalue = function(param, answers, parent) {
  let schema = this.maybeResolveRef(param.schema);
  let itemSchema = this.maybeResolveRef(schema.items);
  if (schema.type === 'file' && this.fileCode) return this.fileCode();
  var self = this;
  let enm = schema.enum;
  let enumLabels = schema['x-enumLabels'];
  let enumType = schema['x-enumType'];
  if (schema.oneOf && schema.oneOf[0].enum) {
    enm = schema.oneOf.map(sub => sub.enum[0])
    enumLabels = schema.oneOf.map(sub => sub.title);
    enumType = schema.title;
  } else if (param.name.match(/\[orderBy\]/) && parent) {
    enumType = parent.schema.title.replace(/Filter$/, 'OrderBy');
    let enumDef = this.swagger['x-enums'][enumType];
    if (enumDef) {
      enm = enumDef.oneOf.map(s => s.enum[0]);
      enumLabels = enumDef.oneOf.map(s => s.title);
    }
  }
  let answer = answers[param.name];
  if (answer === undefined) {
    answer = getDefaultValueForType(schema.type);
  }
  if (schema['x-inputType'] === 'password' && answer) {
    let pass = '';
    for (let i = 0; i < answer.length; ++i) pass += '*';
    answer = pass;
  }

  if (schema.type === 'object') {
    if (schema['x-abstract'] && !answers[param.name + '[objectType]']) {
      return self.nullKeyword + ' ' + self.comment(schema.title + " is an abstract class, please select an implementation");
    } else {
      return self.objPrefix + self.rewriteType(schema.title, itemSchema && (itemSchema.title || itemSchema.type)) + self.objSuffix;
    }
  } else if (schema.type === 'array') {
    return self.emptyArray(this.rewriteType(itemSchema.title || itemSchema.type), 0);
  } else {
    if (enm && enumLabels) {
      let enumName = enumLabels[enm.indexOf(answer)];
      if (enumName) {
        if (self.rewriteEnumValue) return self.rewriteEnumValue(enumType, enumName, answer);
        return self.enumPrefix + self.rewriteType(enumType) + (self.enumAccessor || self.accessor) + enumName;
      }
    }
    return self.constant(answer);
  }
}

CodeTemplate.LANGUAGES = Object.keys(language_opts).filter(l => l !== 'default');
CodeTemplate.LANGUAGE_DETAILS = language_opts;
