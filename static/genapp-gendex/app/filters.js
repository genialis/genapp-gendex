'use strict';


JSON.flattenData = function(data) {
    if (!data)
        return {};

    var all = '',
        result = {},
        data = data;

    function recurse (value, shema) {
        if (Object(value) !== value) {
            shema = shema.toLowerCase();
            result[shema] = (result[shema]) ? result[shema] + String(value).toLowerCase() : String(value).toLowerCase();
            all += result[shema] + ' ';

        } else if (Array.isArray(value)) {
            shema = shema.toLowerCase();
            result[shema] = (result[shema]) ? result[shema] + value.join('').toLowerCase() : value.join('').toLowerCase();
            all += result[shema] + ' ';
        } else {
            for (var p in value) {
                // skip output.proc
                if (p === 'proc' && shema.proc.stdout) continue;

                // field not in schema, nor type basic: with object value (e.g. basic:file:)
                if (!shema[p] && $.type(shema) !== 'string') {
                    console.log("WARNING: Invalid schema for data object " + data.static.name + " (" + data.id + ")");
                    continue;
                }

                // we need "|| shema" for types basic: with object value (e.g. basic:file:)
                recurse(value[p], shema[p] || shema);
            }
        }
    }

    function schemaDict (schema) {
        var s = {};
        for (var i=0, len=schema.length; i < len; i++) {
            var sc = schema[i];
            s[sc.name] = ('group' in sc) ? schemaDict(sc['group']) : sc.label;
        }

        return s;
    }

    recurse(data.input, schemaDict(data.input_schema));
    recurse(data.static, schemaDict(data.static_schema));
    recurse(data['var'], schemaDict(data.var_template));
    recurse(data.output, schemaDict(data.output_schema));
    result.status = data.status;
    result.type = data.type;
    result.all = all;
    return result;
}

JSON.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

JSON.unflatten = function(data) {
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in data) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = data[p];
    }
    return resultholder[""] || resultholder;
};

_.mixin({
    sum: function (data) {
        return _.reduce(data, function(sum, value) {
            return sum + value;
        }, 0);
    }
});

angular.module('gendex.filters', [])
    // data:reads:fastq -> reads / fastq
    .filter('datatype', function () {
        var typeMap = {
            'bam': 'BAM',
            'gff3': 'GFF3',
            'gtf': 'GTF',
            'vcf': 'VCF',
            'etc': 'ETC',
            'geneinfo': 'Gene info',
            'fasta': 'FASTA',
            'bcm': 'BCM',
            'qseq': 'QSEQ',
            'obo': 'OBO',
            'ontologyenrichment': 'Ontology enrichment',
            'fastq': 'FASTQ',
            'differentialexpression': 'Differential Expresson',
            'polya': 'mRNA'
        };

        return function (type) {
            type = type.split(':');
            type = type.splice(1, type.length - 2);
            for (var i=0, len=type.length; i < len; i++) {
                if (type[i] in typeMap) {
                    type[i] = typeMap[type[i]];
                } else {
                    type[i] = type[i].charAt(0).toUpperCase() + type[i].substring(1);
                }
            }

            return type.join(' / ');
        }
    })
    .filter('gendate', ['$filter', function ($filter) {
        return function (date, format) {
            if (date && date.length === 26) {
                var date = date.substring(0, date.length - 3);
            }
            return $filter('date')(new Date(date), format);
        }
    }])
;
