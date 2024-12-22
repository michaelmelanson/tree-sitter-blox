/**
 * @file A parser for the Blox language
 * @author Michael Melanson <michael@michaelmelanson.net>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "blox",

  rules: {
    source_file: ($) => optional($._statement_list),
    comment: ($) => choice(token(seq("#", /.*/))),

    block: ($) => seq("{", optional($._statement_list), "}"),
    _statement_list: ($) =>
      repeat1(seq(field("statement", $._statement), optional(";"))),
    _statement: ($) =>
      choice($.definition, $.binding, $.import, $.expression_statement),
    binding: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("value", $._expression),
      ),
    definition: ($) =>
      seq(
        "def",
        field("name", $.identifier),
        "(",
        optional($._function_parameters),
        ")",
        field("body", $.block),
      ),
    _function_parameters: ($) =>
      seq(
        field("parameter", $.identifier),
        repeat(seq(",", field("parameter", $.identifier))),
      ),
    import: ($) =>
      seq(
        "import",
        "{",
        $.imported_symbol,
        repeat(seq(",", $.imported_symbol)),
        "}",
        "from",
        field("path", $.string),
      ),
    imported_symbol: ($) =>
      seq(
        field("identifier", $.identifier),
        optional(seq("as", field("alias", $.identifier))),
      ),
    expression_statement: ($) => field("expression", $._expression),
    _expression: ($) =>
      choice($.group, $._term, $.unary_expression, $.binary_expression),
    _term: ($) =>
      choice(
        $.if_expression,
        $.array_slice,
        $.array_index,
        $.object_index,
        $.method_call,
        $.function_call,
        $.lambda,
        $._value,
      ),
    group: ($) => seq("(", field("expression", $._expression), ")"),
    unary_expression: ($) =>
      prec.left(
        1,
        choice(
          prec(3, seq($.negate, $._expression)),
          prec(3, seq($.not, $._expression)),
        ),
      ),
    binary_expression: ($) => {
      let operators = [
        { operator: $.multiply, precedence: 4 },
        { operator: $.divide, precedence: 4 },

        { operator: $.concatenate, precedence: 3 },
        { operator: $.add, precedence: 3 },
        { operator: $.subtract, precedence: 3 },
        { operator: $.multiply, precedence: 3 },
        { operator: $.divide, precedence: 3 },
        { operator: $.equal, precedence: 3 },
        { operator: $.not_equal, precedence: 3 },
        { operator: $.less_than, precedence: 3 },
        { operator: $.less_or_equal, precedence: 3 },
        { operator: $.greater_than, precedence: 3 },
        { operator: $.greater_or_equal, precedence: 3 },

        { operator: $.assignment, precedence: 1 },
        { operator: $.append, precedence: 1 },
      ];

      return prec.right(
        choice(
          ...operators.map((op) =>
            prec.left(
              op.precedence,
              seq(
                field("lhs", $._expression),
                field("operator", op.operator),
                field("rhs", $._expression),
              ),
            ),
          ),
        ),
      );
    },
    _value: ($) => choice($.literal, $.identifier, $.array, $.object),
    if_expression: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        field("body", $.block),
        repeat(field("elseif", $.elseif_expression)),
        field("else", optional($.else_expression)),
      ),
    elseif_expression: ($) =>
      seq(
        "else",
        "if",
        field("condition", $._expression),
        field("body", $.block),
      ),
    else_expression: ($) => seq("else", field("body", $.block)),
    method_call: ($) =>
      prec(
        5,
        seq(
          field("base", $._expression),
          ".",
          field("function", $.identifier),
          "(",
          optional($._argument_list),
          ")",
        ),
      ),
    function_call: ($) =>
      prec(
        4,
        seq(
          field("function", $._expression),
          "(",
          optional($._argument_list),
          ")",
        ),
      ),
    _argument_list: ($) =>
      seq(
        field("argument", $.argument),
        repeat(seq(",", field("argument", $.argument))),
      ),
    argument: ($) =>
      seq(field("name", $.identifier), ":", field("value", $._expression)),

    array: ($) => seq("[", optional($._array_members), "]"),
    _array_members: ($) =>
      seq(
        field("member", $._expression),
        repeat(seq(",", field("member", $._expression))),
      ),
    array_slice: ($) =>
      prec(
        3,
        seq(
          field("base", $._expression),
          "[",
          optional(field("start", $._expression)),
          "..",
          optional(field("end", $._expression)),
          "]",
        ),
      ),
    array_index: ($) =>
      prec(
        4,
        seq(
          field("base", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    object: ($) => seq("{", optional($._object_members), "}"),
    _object_members: ($) =>
      seq(
        field("member", $.object_member),
        repeat(seq(",", field("member", $.object_member))),
        optional(","),
      ),
    object_member: ($) =>
      seq(field("key", $.identifier), ":", field("value", $._expression)),
    object_index: ($) =>
      prec(
        4,
        seq(field("base", $._expression), ".", field("index", $.identifier)),
      ),
    lambda: ($) => prec(6, seq($._lambda_parameters, field("body", $.block))),
    _lambda_parameters: ($) =>
      seq(
        "|",
        optional(
          seq(
            field("parameter", $.identifier),
            repeat(seq(",", field("parameter", $.identifier))),
          ),
        ),
        "|",
      ),

    unary_operator: ($) => choice($.negate, $.not),
    not: ($) => "!",
    negate: ($) => "-",
    multiply: ($) => "*",
    divide: ($) => "/",
    concatenate: ($) => "++",
    add: ($) => "+",
    subtract: ($) => "-",
    equal: ($) => "==",
    not_equal: ($) => "!=",
    greater_or_equal: ($) => ">=",
    greater_than: ($) => ">",
    less_or_equal: ($) => "<=",
    less_than: ($) => "<",
    assignment: ($) => "=",
    append: ($) => "<<",

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    literal: ($) => choice($.boolean, $.number, $.string, $.symbol),
    boolean: ($) => choice($.boolean_true, $.boolean_false),
    boolean_true: ($) => "true",
    boolean_false: ($) => "false",
    number: ($) => /-?[0-9]+(\.[0-9]+)?/,
    string: ($) =>
      choice(
        seq('"', repeat(choice(/[^"]/, '\\"')), '"'),
        seq("'", repeat(choice(/[^']/, "\\'")), "'"),
      ),
    symbol: ($) => seq(":", /[a-zA-Z_]+/),
  },

  extras: ($) => [/\s/, $.comment],
});
