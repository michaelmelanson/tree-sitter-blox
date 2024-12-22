[
  "let"
  "def"
  "import"
  "if"
] @keyword

[
  (boolean_true)
  (boolean_false)
] @boolean

[
  "("
  ")"
  "{"
  "}"
] @punctuation.bracket

(number) @number
(string) @string

[
  (multiply)
  (divide)
  (concatenate)
  (add)
  (subtract)
  (equal)
  (not_equal)
  (greater_or_equal)
  (greater_than)
  (less_or_equal)
  (less_than)
  (assignment)
  (append)
] @operator

(definition
  name:(identifier) @function
  parameter:(identifier) @parameter
)

(lambda
  parameter:(identifier) @parameter
  body: (block)@function.body
)

(function_call function:(identifier) @function.call)
