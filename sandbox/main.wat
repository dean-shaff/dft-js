(module
  (func (result i32)
    (i32.const 42)
  )
  (func (result i32)
    (local $x i32)
    (local.get $x)
  )
  (export "helloWorld" (func 0))
  (export "helloWorld1" (func 1))
)